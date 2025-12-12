import Foundation
import Combine
import SwiftUI

public class AppConfiguration: ObservableObject {
    public static let shared = AppConfiguration()
    
    private init() {}

    public var apiBaseURL: String {
        #if DEBUG
        return "http://localhost:3000/v1"
        #else
        return "https://api.macinterviewcopilot.com/v1"
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
    
    @Published public var useDirectOllama: Bool = UserDefaults.standard.bool(forKey: "useDirectOllama") {
        didSet {
            UserDefaults.standard.set(useDirectOllama, forKey: "useDirectOllama")
        }
    }
}
