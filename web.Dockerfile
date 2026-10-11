# syntax=docker/dockerfile:1
# Builds the React app AND the ASP.NET app into one image. Build context = project root.
#
# >>> If your layout differs, change ONLY these four values (or set them in .env) <<<
ARG DOTNET_VERSION=9.0
ARG NODE_VERSION=20
ARG FRONTEND_DIR=ClientApp
ARG FRONTEND_OUT=dist

# ───────────── 1) React ─────────────
FROM node:${NODE_VERSION}-alpine AS frontend
ARG FRONTEND_DIR
WORKDIR /src/${FRONTEND_DIR}
COPY ${FRONTEND_DIR}/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY ${FRONTEND_DIR}/ ./
RUN npm run build

# ───────────── 2) ASP.NET ─────────────
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
ARG FRONTEND_DIR
ARG FRONTEND_OUT
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
# Put the freshly built React files where ASP.NET serves static files (wwwroot).
# If your Vite/CRA config already writes into ../wwwroot, the copy is skipped automatically.
COPY --from=frontend /src/wwwroot/ /frontend-out/
RUN mkdir -p wwwroot \
 && if [ "$(realpath /frontend-out)" != "$(realpath wwwroot)" ]; then cp -a /frontend-out/. wwwroot/; fi
RUN dotnet publish ./*.csproj -c Release -o /out /p:UseAppHost=false

# ───────────── 3) Runtime (small, non-root) ─────────────
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8470 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true
COPY --from=build /out ./
# Folder for the login-cookie encryption keys (mounted as a volume so logins survive redeploys).
RUN mkdir -p /keys && chown app:app /keys
USER app
EXPOSE 8470
# Starts whichever *.dll the project produced, so the project name does not matter.
ENTRYPOINT ["sh", "-c", "exec dotnet \"$(ls /app/*.runtimeconfig.json | head -n1 | sed 's/\\.runtimeconfig\\.json$/.dll/')\""]
