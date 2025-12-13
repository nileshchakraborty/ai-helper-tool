import Foundation
import SwiftUI
import Combine
import OpenAPIClient

public class AppState: ObservableObject {
    @Published public var isLoggedIn: Bool = false
    @Published public var currentSessionId: String? = nil
    @Published public var userProfile: UserProfile? = nil
    @Published public var windowOpacity: Double = 1.0
    
    public static let shared = AppState()
    
    private init() {
        checkLoginStatus()
    }
    
    public func checkLoginStatus() {
        if KeychainService.shared.getAccessToken() != nil {
            // Verify token validity or refresh? 
            // For MVP, just assume valid if present. 
            // Better: Perform a /profile check
            self.isLoggedIn = true
            fetchProfile()
        } else {
            self.isLoggedIn = false
        }
    }
    
    public func login(accessToken: String, user: UserProfile) {
        KeychainService.shared.saveAccessToken(accessToken)
        self.isLoggedIn = true
        self.userProfile = user
    }
    
    public func logout() {
        KeychainService.shared.deleteAccessToken()
        self.isLoggedIn = false
        self.userProfile = nil
        self.currentSessionId = nil
    }
    
    private func fetchProfile() {
        // TODO: Call APIClient.shared.profile to get user details
        // Since we are using Generated Client, we need to bridge it or use direct URLSession if Generated Client is complex
        // But we have APIClient.swift... let's see what it wraps.
    }
}
