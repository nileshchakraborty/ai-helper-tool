import XCTest
@testable import MacInterviewCopilotApp
import NaturalLanguage

final class AppleAIServiceTests: XCTestCase {
    
    // MARK: - Sentiment Tests
    
    @MainActor
    func testSentimentAnalysisPositive() {
        let text = "I am absolutely thrilled and confident about this opportunity."
        let result = AppleAIService.shared.analyzeSentiment(text)
        
        XCTAssertGreaterThan(result.score, 0.1, "Should identify positive sentiment")
        XCTAssertEqual(result.label, "Positive")
    }
    
    @MainActor
    func testSentimentAnalysisNegative() {
        let text = "I failed miserably and it was a terrible disaster."
        let result = AppleAIService.shared.analyzeSentiment(text)
        
        XCTAssertLessThan(result.score, -0.5, "Should identify strong negative sentiment")
        XCTAssertEqual(result.label, "Negative")
    }
    
    // MARK: - Question Type Tests
    
    @MainActor
    func testIdentifyBehavioralQuestion() {
        let text = "Tell me about a time you had a conflict with a coworker."
        let type = AppleAIService.shared.identifyQuestionType(text)
        XCTAssertEqual(type, .behavioral)
    }
    
    @MainActor
    func testIdentifySystemDesignQuestion() {
        let text = "How would you design a scalable notification system like WhatsApp?"
        let type = AppleAIService.shared.identifyQuestionType(text)
        XCTAssertEqual(type, .systemDesign)
    }
    
    @MainActor
    func testIdentifyCaseQuestion() {
        let text = "Our client is a coffee shop chain seeing declining revenue. Why?"
        let type = AppleAIService.shared.identifyQuestionType(text)
        XCTAssertEqual(type, .caseInterview)
    }
    
    // MARK: - Framework Suggestions
    
    @MainActor
    func testFrameworkUseSTAR() {
        let suggestion = AppleAIService.shared.suggestFramework(for: .behavioral)
        XCTAssertTrue(suggestion.contains("STAR"), "Should suggest STAR for behavioral")
    }
    
    @MainActor
    func testFrameworkUseMECE() {
        let suggestion = AppleAIService.shared.suggestFramework(for: .caseInterview)
        XCTAssertTrue(suggestion.contains("MECE"), "Should suggest MECE for case interview")
    }
}
