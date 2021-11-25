## Socket&#046;IO Events

### client -> server

#### `start_capture`

Start capturing operations.

- arguments
  - url
    - type: string
  - config
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "platformName": {
            "type": "string" // "PC" or "Android" or "iOS"
          },
          "browserName": {
            "type": "string" // "Chrome" or "Safari"
          },
          "device": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "osVersion": {
                "type": "string"
              }
            }
          },
          "platformVersion": {
            "type": "string"
          },
          "waitTimeForStartupReload": {
            "type": "number" // seconds
          }
        }
      }
      ```

#### `stop_capture`

Stop capturing operations.

#### `pause_capture`

Pause capturing operations.

#### `resume_capture`

Resume capturing operations.

#### `take_screenshot`

Take a screenshot of the capturing window.

#### `browser_back`

Go back to previous page on capturing browser.

#### `browser_forward`

Go forward to next page on capturing browser.

#### `switch_capturing_window`

Switch capturing window.

- arguments
  - destWindowHandle
    - type: string

#### `run_operations`

Run operations.

- arguments
  - operations
    - type: string(json)
      ```json
      {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "input": {
              "type": "string"
            },
            "type": {
              "type": "string"
            },
            "elementInfo": {
              "type": "object",
              "properties": {
                "tagname": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                },
                "value": {
                  "type": "string"
                },
                "xpath": {
                  "type": "string"
                },
                "checked": {
                  "type": "boolean"
                },
                "attributes": {
                  "type": "object",
                  "patternProperties": {
                    ".+$": {
                      "type": "string"
                    }
                  }
                }
              }
            },
            "title": {
              "type": "string"
            },
            "url": {
              "type": "string"
            },
            "imageData": {
              "type": "string"
            },
            "windowHandle": {
              "type": "string"
            },
            "timestamp": {
              "type": "string"
            },
            "screenElements": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "tagname": {
                    "type": "string"
                  },
                  "text": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  },
                  "xpath": {
                    "type": "string"
                  },
                  "checked": {
                    "type": "boolean"
                  },
                  "attributes": {
                    "type": "object",
                    "patternProperties": {
                      ".+$": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            },
            "pageSource": {
              "type": "string"
            },
            "inputElements": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "tagname": {
                    "type": "string"
                  },
                  "text": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  },
                  "xpath": {
                    "type": "string"
                  },
                  "checked": {
                    "type": "boolean"
                  },
                  "attributes": {
                    "type": "object",
                    "patternProperties": {
                      ".+$": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      ```
  - config
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "platformName": {
            "type": "string" // "PC" or "Android" or "iOS"
          },
          "browserName": {
            "type": "string" // "Chrome" or "Safari"
          },
          "device": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "osVersion": {
                "type": "string"
              }
            }
          },
          "platformVersion": {
            "type": "string"
          },
          "waitTimeForStartupReload": {
            "type": "number" // seconds
          }
        }
      }
      ```

#### `stop_run_operations`

Stop running operations.

### server -> client

#### `capture_started`

Capturing has started.

#### `capture_paused`

Capturing has paused.

#### `capture_resumed`

Capturing has resumed.

#### `operation_captured`

An operation has been captured.

- arguments
  - operation
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "input": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "elementInfo": {
            "type": "object",
            "properties": {
              "tagname": {
                "type": "string"
              },
              "text": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "xpath": {
                "type": "string"
              },
              "checked": {
                "type": "boolean"
              },
              "attributes": {
                "type": "object",
                "patternProperties": {
                  ".+$": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "title": {
            "type": "string"
          },
          "url": {
            "type": "string"
          },
          "imageData": {
            "type": "string" // base64
          },
          "windowHandle": {
            "type": "string"
          },
          "timestamp": {
            "type": "string"
          },
          "screenElements": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "tagname": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                },
                "value": {
                  "type": "string"
                },
                "xpath": {
                  "type": "string"
                },
                "checked": {
                  "type": "boolean"
                },
                "attributes": {
                  "type": "object",
                  "patternProperties": {
                    ".+$": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "pageSource": {
            "type": "string"
          },
          "inputElements": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "tagname": {
                  "type": "string"
                },
                "text": {
                  "type": "string"
                },
                "value": {
                  "type": "string"
                },
                "xpath": {
                  "type": "string"
                },
                "checked": {
                  "type": "boolean"
                },
                "attributes": {
                  "type": "object",
                  "patternProperties": {
                    ".+$": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
      ```

#### `screen_transition_captured`

An screen transition has been captured.

- arguments
  - screenTransition
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "url": {
            "type": "string"
          },
          "imageData": {
            "type": "string" // base64
          },
          "windowHandle": {
            "type": "string"
          },
          "timestamp": {
            "type": "string"
          },
          "pageSource": {
            "type": "string"
          }
        }
      }
      ```

#### `screenshot_taken`

An screenshot has been taken.

- arguments
  - screenshot
    - type: string(base64)

#### `browser_history_changed`

Browser history(whether it can go back/forward or not) has been changed.

- arguments
  - browserStatus
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "canGoBack": {
            "type": "boolean"
          },
          "canGoForward": {
            "type": "boolean"
          }
        }
      }
      ```

#### `browser_windows_changed`

The number of opened windows has been changed.

- arguments
  - windowInformation
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "windowHandles": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "currentWindowHandle": {
            "type": "string"
          }
        }
      }
      ```

#### `alert_visibility_changed`

Alert dialog(alert, confirm, prompt) visibility has been changed.

- arguments
  - alertVisibleStatus
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "isVisible": "boolean"
        }
      }
      ```

#### `run_operations_completed`

Running operations has completed.

#### `run_operations_canceled`

Running operations has canceled.

#### `run_operations_aborted`

Running operations has aborted.

#### `error_occurred`

An error has occurred.

- arguments
  - serverError
    - type: string(json)
      ```json
      {
        "type": "object",
        "properties": {
          "code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "details": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "code": {
                  "type": "string"
                },
                "message": {
                  "type": "string"
                },
                "target": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
      ```
