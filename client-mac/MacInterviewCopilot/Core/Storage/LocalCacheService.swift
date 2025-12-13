import Foundation

public class LocalCacheService {
    public static let shared = LocalCacheService()
    private let cache = NSCache<NSString, NSData>()
    
    private init() {}
    
    public func setObject(_ data: Data, forKey key: String) {
        cache.setObject(data as NSData, forKey: key as NSString)
    }
    
    public func object(forKey key: String) -> Data? {
        return cache.object(forKey: key as NSString) as Data?
    }
    
    public func removeObject(forKey key: String) {
        cache.removeObject(forKey: key as NSString)
    }
}
