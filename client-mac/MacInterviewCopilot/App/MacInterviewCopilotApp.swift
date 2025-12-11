import SwiftUI
import Combine

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

class AppDelegate: NSObject, NSApplicationDelegate {
    var overlayWindow: OverlayWindow!
    private var cancellables = Set<AnyCancellable>()
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // STEALTH: Hide from Dock - app runs as background accessory
        NSApp.setActivationPolicy(.accessory)
        
        // Initialize Hotkey Manager
        _ = GlobalHotkeyManager.shared
        
        // Setup Overlay Window with larger size for better usability
        let contentView = OverlayView().environmentObject(AppState.shared)
        overlayWindow = OverlayWindow(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 600),
            backing: .buffered,
            defer: false
        )
        overlayWindow.contentView = NSHostingView(rootView: contentView)
        
        // Position window in bottom-right corner (less conspicuous)
        if let screen = NSScreen.main {
            let screenRect = screen.visibleFrame
            let windowRect = overlayWindow.frame
            let x = screenRect.maxX - windowRect.width - 20
            let y = screenRect.minY + 20
            overlayWindow.setFrameOrigin(NSPoint(x: x, y: y))
        }
        
        // Bind visibility to hotkey toggle
        GlobalHotkeyManager.shared.$isOverlayVisible
            .sink { [weak self] visible in
                if visible {
                    self?.overlayWindow.makeKeyAndOrderFront(nil)
                    // Bring to front but don't steal focus from other apps
                    NSApp.activate(ignoringOtherApps: false)
                } else {
                    self?.overlayWindow.orderOut(nil)
                }
            }
            .store(in: &cancellables)
        
        // Setup global click-through toggle (Cmd+Shift+T)
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            // Cmd+Shift+T to toggle click-through
            if event.modifierFlags.contains([.command, .shift]) && event.keyCode == 17 { // T key
                self?.overlayWindow.toggleClickThrough()
                return nil
            }
            // Cmd+Shift+O to toggle opacity
            if event.modifierFlags.contains([.command, .shift]) && event.keyCode == 31 { // O key
                self?.overlayWindow.cycleOpacity()
                return nil
            }
            return event
        }
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        // Cleanup
    }
}
