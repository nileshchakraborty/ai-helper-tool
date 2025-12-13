// UserProfile Model
import Foundation

public struct UserProfile: Codable {
    public let id: String?
    public let email: String?
    public let fullName: String?
    public let preferences: UserProfilePreferences?
    
    public init(id: String? = nil, email: String? = nil, fullName: String? = nil, preferences: UserProfilePreferences? = nil) {
        self.id = id
        self.email = email
        self.fullName = fullName
        self.preferences = preferences
    }
}

public struct UserProfilePreferences: Codable {
    public let privacyMode: Bool?
    public let modelProvider: String?
    public let theme: String?
    
    public init(privacyMode: Bool? = nil, modelProvider: String? = nil, theme: String? = nil) {
        self.privacyMode = privacyMode
        self.modelProvider = modelProvider
        self.theme = theme
    }
}
