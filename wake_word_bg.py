import speech_recognition as sr
import sys
import json
import time

def listen_for_Theta():
    r = sr.Recognizer()
    r.energy_threshold = 300
    r.dynamic_energy_threshold = True

    try:
        microphone = sr.Microphone()
    except Exception as exc:
        raise RuntimeError(f"Wake-word microphone unavailable: {exc}")

    with microphone as source:
        print(json.dumps({"type": "INFO", "msg": "Microphone initialized. Tuning ambient noise..."}))
        sys.stdout.flush()
        
        r.adjust_for_ambient_noise(source, duration=0.5)
        
        print(json.dumps({"type": "INFO", "msg": "Theta Engine Active. Listening in background..."}))
        sys.stdout.flush()
        
        while True:
            try:
                audio = r.listen(source, phrase_time_limit=10)
                
                # Processing start log
                # print(json.dumps({"type": "INFO", "msg": "Voice detected, recognizing..."}))
                # sys.stdout.flush()

                text = r.recognize_google(audio).lower()
                words = text.split()
                trigger_word = next((w for w in words if w.endswith("nic")), None)
                
                if trigger_word:
                    # If we found a word ending in 'nic', trigger the AI
                    result = {
                        "type": "WAKE_WORD",
                        "text": text,
                        "command": text.replace(trigger_word, "", 1).strip()
                    }
                    print(json.dumps(result))
                    sys.stdout.flush()
                else:
                    # Log what was heard even if it wasn't a trigger word
                    print(json.dumps({"type": "INFO", "msg": f"Heard: {text}"}))
                    sys.stdout.flush()
                
            except sr.UnknownValueError:
                pass
            except sr.RequestError:
                print(json.dumps({"type": "ERROR", "msg": "Google Speech API Connection Issue"}))
                sys.stdout.flush()
            except Exception as e:
                # Critical error logger
                print(json.dumps({"type": "ERROR", "msg": str(e)}))
                sys.stdout.flush()

if __name__ == "__main__":
    try:
        listen_for_Theta()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as exc:
        # Keep process alive in degraded mode so Electron app does not repeatedly restart it.
        print(json.dumps({"type": "ERROR", "msg": str(exc)}))
        print(json.dumps({"type": "INFO", "msg": "Wake-word disabled until microphone backend is installed."}))
        sys.stdout.flush()
        while True:
            time.sleep(30)
