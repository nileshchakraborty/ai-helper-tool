import Foundation

public class AppConfiguration {
    public static let shared = AppConfiguration()
    
    private init() {}

    public var apiBaseURL: String {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://api.macinterviewcopilot.com"
        #endif
    }

    public static var isDebug: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
    
    public static var showPromptDebug: Bool {
        return isDebug
    }
}
