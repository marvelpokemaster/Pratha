from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import urllib.request
import urllib.error
import hmac
import hashlib
import base64
import time

app = FastAPI(title="Utsavam Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateOrderRequest(BaseModel):
    amount: int  # amount in paise (min 100)
    currency: str = "INR"
    receipt: str = None
    notes: dict = None

class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    razorpay_signature: str

class AskRequest(BaseModel):
    query: str
    userId: str = None

class AskResponse(BaseModel):
    response: str

@app.get("/")
def read_root():
    return {
        "message": "Utsavam API running on Cloudflare Workers",
        "status": "healthy",
        "endpoints": [
            "/health",
            "/api/v1/health",
            "/api/create-order",
            "/api/verify-payment",
            "/api/v1/catalog/gaushalas",
            "/api/v1/catalog/pujas",
            "/api/v1/ai/ask"
        ]
    }

@app.post("/api/create-order")
@app.post("/api/v1/payments/create-order")
def create_order(req: CreateOrderRequest):
    if req.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum amount is 100 paise (₹1.00)")
    
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
        
    auth_str = f"{key_id}:{key_secret}"
    auth_header = f"Basic {base64.b64encode(auth_str.encode()).decode()}"
    receipt = req.receipt or f"rcpt_{int(time.time())}"
    
    payload = {
        "amount": req.amount,
        "currency": req.currency,
        "receipt": receipt
    }
    if req.notes:
        payload["notes"] = req.notes
        
    try:
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            "https://api.razorpay.com/v1/orders",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": auth_header
            }
        )
        with urllib.request.urlopen(request, timeout=15) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            return {
                "order_id": res_data.get("id"),
                "amount": res_data.get("amount"),
                "currency": res_data.get("currency"),
                "receipt": res_data.get("receipt")
            }
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise HTTPException(status_code=500, detail=f"Razorpay API error: {err_msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-payment")
@app.post("/api/v1/payments/verify-payment")
def verify_payment(req: VerifyPaymentRequest):
    if not req.order_id or not req.payment_id or not req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing required payment verification fields")
        
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    if not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
        
    msg = f"{req.order_id}|{req.payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, req.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")
        
    return {"status": "success", "message": "Payment verified successfully"}

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "utsavam-backend",
        "runtime": "cloudflare-workers-python"
    }

@app.get("/api/v1/catalog/gaushalas")
def get_gaushalas():
    project_id = os.environ.get("FIREBASE_PROJECT_ID", "sattva-utsavam-dev")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/gaushalas"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Utsavam-Worker"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            documents = data.get("documents", [])
            results = []
            for doc in documents:
                fields = doc.get("fields", {})
                item = {}
                for k, v in fields.items():
                    if "stringValue" in v:
                        item[k] = v["stringValue"]
                    elif "integerValue" in v:
                        item[k] = int(v["integerValue"])
                    elif "doubleValue" in v:
                        item[k] = float(v["doubleValue"])
                    elif "booleanValue" in v:
                        item[k] = v["booleanValue"]
                item["id"] = doc.get("name", "").split("/")[-1]
                results.append(item)
            return {"gaushalas": results, "count": len(results), "source": "firestore"}
    except urllib.error.HTTPError as e:
        # If Firestore collection is empty or project doesn't exist yet, return structured fallback
        return {
            "gaushalas": [],
            "count": 0,
            "source": f"firestore:{project_id}",
            "http_status": e.code,
            "message": f"Firestore query returned HTTP {e.code}"
        }
    except Exception as e:
        return {
            "gaushalas": [],
            "count": 0,
            "source": f"firestore:{project_id}",
            "error": str(e)
        }

@app.get("/api/v1/catalog/pujas")
def get_pujas():
    project_id = os.environ.get("FIREBASE_PROJECT_ID", "sattva-utsavam-dev")
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/pujas"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Utsavam-Worker"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            documents = data.get("documents", [])
            results = []
            for doc in documents:
                fields = doc.get("fields", {})
                item = {}
                for k, v in fields.items():
                    if "stringValue" in v:
                        item[k] = v["stringValue"]
                    elif "integerValue" in v:
                        item[k] = int(v["integerValue"])
                    elif "doubleValue" in v:
                        item[k] = float(v["doubleValue"])
                    elif "booleanValue" in v:
                        item[k] = v["booleanValue"]
                item["id"] = doc.get("name", "").split("/")[-1]
                results.append(item)
            return {"pujas": results, "count": len(results), "source": "firestore"}
    except Exception as e:
        return {"pujas": [], "count": 0, "source": f"firestore:{project_id}", "info": str(e)}

@app.post("/api/v1/ai/ask", response_model=AskResponse)
def ask_ai(req: AskRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing on server")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [{"text": req.query}]
            }
        ]
    }
    
    try:
        req_data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(request, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return AskResponse(response=text)
            else:
                return AskResponse(response="No response generated.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

try:
    import asgi
    from workers import WorkerEntrypoint

    class Default(WorkerEntrypoint):
        async def fetch(self, request):
            return await asgi.fetch(app, request, self.env)
except ImportError:
    pass
