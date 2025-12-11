# DefaultAPI

All URIs are relative to *http://localhost:3000/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**healthGet**](DefaultAPI.md#healthget) | **GET** /health | Health check
[**profileGet**](DefaultAPI.md#profileget) | **GET** /profile | Get user profile
[**profilePreferencesPatch**](DefaultAPI.md#profilepreferencespatch) | **PATCH** /profile/preferences | Update user preferences
[**sessionsGet**](DefaultAPI.md#sessionsget) | **GET** /sessions | Get session history
[**sessionsIdMessagesGet**](DefaultAPI.md#sessionsidmessagesget) | **GET** /sessions/{id}/messages | Get session messages
[**sessionsPost**](DefaultAPI.md#sessionspost) | **POST** /sessions | Start a new session


# **healthGet**
```swift
    open class func healthGet(completion: @escaping (_ data: Void?, _ error: Error?) -> Void)
```

Health check

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient


// Health check
DefaultAPI.healthGet() { (response, error) in
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
This endpoint does not need any parameter.

### Return type

Void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profileGet**
```swift
    open class func profileGet(completion: @escaping (_ data: UserProfile?, _ error: Error?) -> Void)
```

Get user profile

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient


// Get user profile
DefaultAPI.profileGet() { (response, error) in
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
This endpoint does not need any parameter.

### Return type

[**UserProfile**](UserProfile.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profilePreferencesPatch**
```swift
    open class func profilePreferencesPatch(body: UserProfilePreferences? = nil, completion: @escaping (_ data: UserProfile?, _ error: Error?) -> Void)
```

Update user preferences

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let body = UserProfile_preferences(saveSessionHistory: false, dataRetentionDays: 123) // UserProfilePreferences |  (optional)

// Update user preferences
DefaultAPI.profilePreferencesPatch(body: body) { (response, error) in
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
 **body** | **UserProfilePreferences** |  | [optional] 

### Return type

[**UserProfile**](UserProfile.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsGet**
```swift
    open class func sessionsGet(completion: @escaping (_ data: [Session]?, _ error: Error?) -> Void)
```

Get session history

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient


// Get session history
DefaultAPI.sessionsGet() { (response, error) in
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
This endpoint does not need any parameter.

### Return type

[**[Session]**](Session.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsIdMessagesGet**
```swift
    open class func sessionsIdMessagesGet(id: String, completion: @escaping (_ data: [SessionsIdMessagesGet200ResponseInner]?, _ error: Error?) -> Void)
```

Get session messages

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let id = "id_example" // String | 

// Get session messages
DefaultAPI.sessionsIdMessagesGet(id: id) { (response, error) in
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
 **id** | **String** |  | 

### Return type

[**[SessionsIdMessagesGet200ResponseInner]**](SessionsIdMessagesGet200ResponseInner.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sessionsPost**
```swift
    open class func sessionsPost(sessionsPostRequest: SessionsPostRequest? = nil, completion: @escaping (_ data: Session?, _ error: Error?) -> Void)
```

Start a new session

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let sessionsPostRequest = _sessions_post_request(title: "title_example", type: "type_example") // SessionsPostRequest |  (optional)

// Start a new session
DefaultAPI.sessionsPost(sessionsPostRequest: sessionsPostRequest) { (response, error) in
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
 **sessionsPostRequest** | [**SessionsPostRequest**](SessionsPostRequest.md) |  | [optional] 

### Return type

[**Session**](Session.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

