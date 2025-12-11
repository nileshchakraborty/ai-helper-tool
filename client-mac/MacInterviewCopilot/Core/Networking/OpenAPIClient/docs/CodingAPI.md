# CodingAPI

All URIs are relative to *http://localhost:3000/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**codingAssistPost**](CodingAPI.md#codingassistpost) | **POST** /coding/assist | Get coding assistance (Streamed)


# **codingAssistPost**
```swift
    open class func codingAssistPost(codingStreamRequest: CodingStreamRequest, completion: @escaping (_ data: String?, _ error: Error?) -> Void)
```

Get coding assistance (Streamed)

Returns text/event-stream with reasoning and code.

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let codingStreamRequest = CodingStreamRequest(question: "question_example", code: "code_example", screenSnapshot: "screenSnapshot_example", provider: "provider_example", sessionId: "sessionId_example", screenContext: URL(string: "https://example.com")!) // CodingStreamRequest | 

// Get coding assistance (Streamed)
CodingAPI.codingAssistPost(codingStreamRequest: codingStreamRequest) { (response, error) in
    guard error == nil else {
        print(error)
        return
    }

    if (response) {
        dump(response)
    }
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **codingStreamRequest** | [**CodingStreamRequest**](CodingStreamRequest.md) |  | 

### Return type

**String**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: text/event-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

