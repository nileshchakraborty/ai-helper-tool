import Cocoa
import Carbon

class GlobalHotkeyManager: ObservableObject {
    static let shared = GlobalHotkeyManager()
    
    @Published var isOverlayVisible: Bool = false
    
    private var hotKeyRef: EventHotKeyRef?
    
    private init() {
        // Register Cmd+Shift+Space (example) or configurable
        registerHotKey()
        
        // Install event handler
        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        
        InstallEventHandler(GetApplicationEventTarget(), { (_: EventHandlerCallRef?, _: EventRef?, _: UnsafeMutableRawPointer?) -> OSStatus in
            // Handle hotkey
            DispatchQueue.main.async {
                GlobalHotkeyManager.shared.toggleOverlay()
            }
            return noErr
        }, 1, &eventType, nil, nil)
    }
    
    private func registerHotKey() {
        let modifiers = cmdKey | shiftKey
        let keyCode = 49 // Space
        // Note: Real app should allow user configuration
        
        var hotKeyID = EventHotKeyID()
        hotKeyID.signature = OSType(0x1111) // arbitrary signature
        hotKeyID.id = 1
        
        RegisterEventHotKey(UInt32(keyCode), UInt32(modifiers), hotKeyID, GetApplicationEventTarget(), 0, &hotKeyRef)
    }
    
    func toggleOverlay() {
        isOverlayVisible.toggle()
        if isOverlayVisible {
            NSApp.activate(ignoringOtherApps: true)
            // OverlayWindow should appear
        } else {
            NSApp.hide(nil)
        }
    }
}
