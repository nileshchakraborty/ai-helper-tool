# AuthAPI

All URIs are relative to *http://localhost:3000/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**authLoginPost**](AuthAPI.md#authloginpost) | **POST** /auth/login | Login user
[**authSignupPost**](AuthAPI.md#authsignuppost) | **POST** /auth/signup | Register new user


# **authLoginPost**
```swift
    open class func authLoginPost(loginRequest: LoginRequest? = nil, completion: @escaping (_ data: AuthResponse?, _ error: Error?) -> Void)
```

Login user

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let loginRequest = LoginRequest(email: "email_example", password: "password_example") // LoginRequest |  (optional)

// Login user
AuthAPI.authLoginPost(loginRequest: loginRequest) { (response, error) in
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
 **loginRequest** | [**LoginRequest**](LoginRequest.md) |  | [optional] 

### Return type

[**AuthResponse**](AuthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authSignupPost**
```swift
    open class func authSignupPost(signUpRequest: SignUpRequest? = nil, completion: @escaping (_ data: AuthResponse?, _ error: Error?) -> Void)
```

Register new user

### Example
```swift
// The following code samples are still beta. For any issue, please report via http://github.com/OpenAPITools/openapi-generator/issues/new
import OpenAPIClient

let signUpRequest = SignUpRequest(email: "email_example", password: "password_example", fullName: "fullName_example") // SignUpRequest |  (optional)

// Register new user
AuthAPI.authSignupPost(signUpRequest: signUpRequest) { (response, error) in
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
 **signUpRequest** | [**SignUpRequest**](SignUpRequest.md) |  | [optional] 

### Return type

[**AuthResponse**](AuthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

