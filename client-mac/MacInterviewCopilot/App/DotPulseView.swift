import SwiftUI

struct DotPulseView: View {
    @State private var phase = 0.0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.cyan)
                    .frame(width: 6, height: 6)
                    .scaleEffect(calcScale(index: index))
                    .opacity(calcOpacity(index: index))
                    .animation(
                        Animation.easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(Double(index) * 0.2),
                        value: phase
                    )
            }
        }
        .onAppear {
            phase = 1.0
        }
    }
    
    func calcScale(index: Int) -> CGFloat {
        return phase == 1.0 ? 1.2 : 0.8
    }
    
    func calcOpacity(index: Int) -> Double {
        return phase == 1.0 ? 1.0 : 0.4
    }
}
