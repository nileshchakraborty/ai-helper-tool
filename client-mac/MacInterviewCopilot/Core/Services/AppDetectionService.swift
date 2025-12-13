import Foundation
import ScreenCaptureKit

public struct DetectedApp: Identifiable, Hashable {
    public let id: String
    public let name: String
    public let bundleIdentifier: String
    public let scWindow: SCWindow? // The main window associated with this app/context
}

public class AppDetectionService: ObservableObject {
    @Published public var detectedApps: [DetectedApp] = []
    
    // Bundle IDs to look for
    private let targetBundleIDs: Set<String> = [
        "us.zoom.xos",          // Zoom
        "com.microsoft.teams",  // Teams (Classic)
        "com.microsoft.teams2", // Teams (New)
        "com.amazon.chime",     // Amazon Chime
        "com.google.Chrome",    // Google Chrome
        "com.apple.Safari",     // Safari
        "company.thebrowser.Browser", // Arc
        "com.microsoft.edgemac" // Edge
    ]
    
    // Keywords in window titles to identify browser-based platforms
    private let browserKeywords: [String] = [
        "Meet", "HackerRank", "CodeSignal", "LeetCode", "CoderPad"
    ]
    
    public init() {}
    
    @MainActor
    public func scanOpenApps() async {
        do {
            let content = try await SCShareableContent.current
            var newDetectedApps: [DetectedApp] = []
            
            // 1. Filter applications
            let relevantApps = content.applications.filter { app in
                targetBundleIDs.contains(app.bundleIdentifier)
            }
            
            // 2. Identify specific windows/contexts
            for app in relevantApps {
                let windows = content.windows.filter { $0.owningApplication?.bundleIdentifier == app.bundleIdentifier }
                
                // For Browsers, look for specific tabs (Window Titles)
                if isBrowser(bundleId: app.bundleIdentifier) {
                    for window in windows {
                        if let title = window.title, browserKeywords.contains(where: { title.contains($0) }) {
                            newDetectedApps.append(DetectedApp(
                                id: "\(app.bundleIdentifier)-\(window.windowID)",
                                name: "\(app.applicationName): \(title)",
                                bundleIdentifier: app.bundleIdentifier,
                                scWindow: window
                            ))
                        }
                    }
                } else {
                    // For Native Apps (Zoom, Teams), pick the main window (naive: first non-empty title or just app name)
                    // Often video windows have specific titles, but for MVP we list the App itself as a source.
                    // We pick the first available window as a handle, or nil if we just want to track the app presence.
                    // To support capturing, we preferably want a window.
                    
                    if let mainWin = windows.first {
                         newDetectedApps.append(DetectedApp(
                            id: app.bundleIdentifier,
                            name: app.applicationName,
                            bundleIdentifier: app.bundleIdentifier,
                            scWindow: mainWin
                        ))
                    }
                }
            }
            
            self.detectedApps = newDetectedApps
            
        } catch {
            print("Failed to scan apps: \(error)")
        }
    }
    
    private func isBrowser(bundleId: String) -> Bool {
        return [
            "com.google.Chrome",
            "com.apple.Safari",
            "company.thebrowser.Browser",
            "com.microsoft.edgemac"
        ].contains(bundleId)
    }
}
