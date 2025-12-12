import Cocoa
import Carbon

public class GlobalHotkeyManager: ObservableObject {
    public static let shared = GlobalHotkeyManager()
    
    @Published public var isOverlayVisible: Bool = false
    public var onMuteToggle: (() -> Void)?
    
    private var toggleHotKeyRef: EventHotKeyRef?
    private var muteHotKeyRef: EventHotKeyRef?
    
    private init() {
        registerHotKeys()
        
        // Install event handler
        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        
        InstallEventHandler(GetApplicationEventTarget(), { (_: EventHandlerCallRef?, event: EventRef?, _: UnsafeMutableRawPointer?) -> OSStatus in
            guard let event = event else { return noErr }
            
            var hotKeyID = EventHotKeyID()
            let status = GetEventParameter(event,
                                           EventParamName(kEventParamDirectObject),
                                           EventParamType(typeEventHotKeyID),
                                           nil,
                                           MemoryLayout<EventHotKeyID>.size,
                                           nil,
                                           &hotKeyID)
            
            if status == noErr {
                DispatchQueue.main.async {
                    if hotKeyID.id == 1 {
                        GlobalHotkeyManager.shared.toggleOverlay()
                    } else if hotKeyID.id == 2 {
                        GlobalHotkeyManager.shared.onMuteToggle?()
                    }
                }
            }
            return noErr
        }, 1, &eventType, nil, nil)
    }
    
    private func registerHotKeys() {
        // Toggle Overlay: Cmd+Shift+Space (49)
        let toggleID = EventHotKeyID(signature: OSType(0x1111), id: 1)
        RegisterEventHotKey(UInt32(49), UInt32(cmdKey | shiftKey), toggleID, GetApplicationEventTarget(), 0, &toggleHotKeyRef)
        
        // Toggle Mute: Cmd+Shift+M (46)
        let muteID = EventHotKeyID(signature: OSType(0x2222), id: 2)
        RegisterEventHotKey(UInt32(46), UInt32(cmdKey | shiftKey), muteID, GetApplicationEventTarget(), 0, &muteHotKeyRef)
    }
    
    func toggleOverlay() {
        isOverlayVisible.toggle()
        if isOverlayVisible {
            NSApp.activate(ignoringOtherApps: true)
            // OverlayWindow should appear via Publisher
        } else {
            NSApp.hide(nil)
        }
    }
}
