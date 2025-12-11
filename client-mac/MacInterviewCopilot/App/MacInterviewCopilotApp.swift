import SwiftUI

@main
struct MacInterviewCopilotApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject var appState = AppState.shared
    
    var body: some Scene {
        Settings { 
            // We can add a Settings window later
            EmptyView()
        }
    }
}
// Note: OverlayWindow is managed by AppDelegate, so we need to inject environment there too?
// Yes, OverlayView is created in AppDelegate. Let's look at AppDelegate.

class AppDelegate: NSObject, NSApplicationDelegate {
    var overlayWindow: OverlayWindow!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Initialize Hotkey Manager
        _ = GlobalHotkeyManager.shared
        
        // Setup Overlay Window
        let contentView = OverlayView().environmentObject(AppState.shared)
        overlayWindow = OverlayWindow(
            contentRect: NSRect(x: 0, y: 0, width: 300, height: 200),
            backing: .buffered,
            defer: false
        )
        overlayWindow.contentView = NSHostingView(rootView: contentView)
        overlayWindow.center()
        
        // Bind visibility
        GlobalHotkeyManager.shared.$isOverlayVisible
            .sink { [weak self] visible in
                if visible {
                    self?.overlayWindow.makeKeyAndOrderFront(nil)
                } else {
                    self?.overlayWindow.orderOut(nil)
                }
            }
            .store(in: &cancellables)
    }
    
    private var cancellables = Set<AnyCancellable>()
}

import Combine

