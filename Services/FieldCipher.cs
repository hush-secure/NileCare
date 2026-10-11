using System.Security.Cryptography;
using System.Text;

namespace HospitalSystem.Services;

public class FieldCipher
{
    private const string Prefix = "enc1:";
    private readonly byte[] _encKey;
    private readonly byte[] _indexKey;

    public FieldCipher(IConfiguration config)
    {
        var base64 = config["Encryption:Key"];
        if (string.IsNullOrWhiteSpace(base64))
            throw new InvalidOperationException(
                "Encryption:Key is not set. Generate one with: openssl rand -base64 32");

        var master = Convert.FromBase64String(base64);
        if (master.Length != 32)
            throw new InvalidOperationException("Encryption:Key must be 32 bytes (base64).");

        _encKey = HKDF.DeriveKey(HashAlgorithmName.SHA256, master, 32, info: Encoding.UTF8.GetBytes("nilecare-enc"));
        _indexKey = HKDF.DeriveKey(HashAlgorithmName.SHA256, master, 32, info: Encoding.UTF8.GetBytes("nilecare-index"));
    }

    public string Encrypt(string plain)
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var data = Encoding.UTF8.GetBytes(plain);
        var cipher = new byte[data.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(_encKey, 16);
        aes.Encrypt(nonce, data, cipher, tag);

        var all = new byte[nonce.Length + tag.Length + cipher.Length];
        nonce.CopyTo(all, 0);
        tag.CopyTo(all, nonce.Length);
        cipher.CopyTo(all, nonce.Length + tag.Length);
        return Prefix + Convert.ToBase64String(all);
    }

    public string Decrypt(string stored)
    {
        if (!stored.StartsWith(Prefix, StringComparison.Ordinal)) return stored;

        var all = Convert.FromBase64String(stored[Prefix.Length..]);
        var nonce = all[..12];
        var tag = all[12..28];
        var cipher = all[28..];
        var plain = new byte[cipher.Length];

        using var aes = new AesGcm(_encKey, 16);
        aes.Decrypt(nonce, cipher, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }

    public string BlindIndex(string value) =>
        Convert.ToHexString(HMACSHA256.HashData(_indexKey, Encoding.UTF8.GetBytes(value.Trim().ToLowerInvariant())));
}
