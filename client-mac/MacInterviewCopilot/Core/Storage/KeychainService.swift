import Foundation
import Security

public class KeychainService {
    public static let shared = KeychainService()
    
    private init() {}
    
    public func save(key: String, data: Data) -> OSStatus {
        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ] as [String : Any]
        
        SecItemDelete(query as CFDictionary)
        return SecItemAdd(query as CFDictionary, nil)
    }
    
    public func load(key: String) -> Data? {
        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: kCFBooleanTrue!,
            kSecMatchLimit as String: kSecMatchLimitOne
        ] as [String : Any]
        
        var dataTypeRef: AnyObject? = nil
        let status: OSStatus = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == noErr {
            return dataTypeRef as? Data
        } else {
            return nil
        }
    }
    
    public func delete(key: String) {
        let query = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ] as [String : Any]
        
        SecItemDelete(query as CFDictionary)
    }
    
    // MARK: - Convenience
    public func getAccessToken() -> String? {
        guard let data = load(key: "access_token") else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    public func saveAccessToken(_ token: String) {
        if let data = token.data(using: .utf8) {
            _ = save(key: "access_token", data: data)
        }
    }
    
    public func deleteAccessToken() {
        delete(key: "access_token")
    }
}
