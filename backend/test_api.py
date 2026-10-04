import httpx
import psycopg2
import sys

BASE_URL = "http://localhost:8000"

def test_full_crud():
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    print("--- 1. Testing Health & Root Endpoints ---")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code} {r.text}"
    print("Health check OK:", r.json())

    r_root = client.get("/")
    assert r_root.status_code == 200
    print("Root endpoint OK:", r_root.json())

    print("\n--- 2. Testing CORS Preflight ---")
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    r_cors = client.options("/api/expenses", headers=headers)
    assert r_cors.status_code == 200, f"CORS preflight failed: {r_cors.status_code}"
    assert "access-control-allow-origin" in r_cors.headers, "Missing CORS header"
    print("CORS headers OK! Origin allowed:", r_cors.headers.get("access-control-allow-origin"))

    print("\n--- 3. Testing GET /api/expenses (Initial list) ---")
    r_list = client.get("/api/expenses")
    assert r_list.status_code == 200, f"Failed GET /api/expenses: {r_list.status_code}"
    expenses = r_list.json()
    print(f"Retrieved {len(expenses)} expenses from PostgreSQL")
    assert len(expenses) > 0, "Initial seed list should not be empty"

    print("\n--- 4. Testing POST /api/expenses (Create Expense) ---")
    new_expense_payload = {
        "amount": 42.50,
        "description": "Physics Lab Manual",
        "category": "Education",
        "date": "2026-10-04",
        "payment_method": "UPI",
        "notes": "Calculus & Mechanics Lab"
    }
    r_create = client.post("/api/expenses", json=new_expense_payload)
    assert r_create.status_code == 201, f"Failed to create expense: {r_create.status_code} {r_create.text}"
    created_expense = r_create.json()
    created_id = created_expense["id"]
    print(f"Created Expense with ID: {created_id}")
    assert created_expense["amount"] == 42.50
    assert created_expense["description"] == "Physics Lab Manual"
    assert created_expense["payment_method"] == "UPI"

    print("\n--- 5. Verifying Direct Persistence in PostgreSQL Database ---")
    pg_conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
        database="student_expense_db"
    )
    cur = pg_conn.cursor()
    cur.execute("SELECT id, amount, description, category, payment_method FROM expenses WHERE id = %s;", (created_id,))
    row = cur.fetchone()
    assert row is not None, f"Expense ID {created_id} NOT found in PostgreSQL!"
    print(f"Direct PostgreSQL DB Verification SUCCESS: id={row[0]}, amount={row[1]}, desc='{row[2]}', cat='{row[3]}', payment='{row[4]}'")
    pg_conn.close()

    print(f"\n--- 6. Testing GET /api/expenses/{created_id} ---")
    r_get = client.get(f"/api/expenses/{created_id}")
    assert r_get.status_code == 200
    assert r_get.json()["id"] == created_id
    print("GET by ID succeeded:", r_get.json()["description"])

    print(f"\n--- 7. Testing PUT /api/expenses/{created_id} (Update Expense) ---")
    update_payload = {
        "amount": 49.99,
        "description": "Physics Lab Manual & Safety Goggles",
        "notes": "Updated with lab goggles"
    }
    r_update = client.put(f"/api/expenses/{created_id}", json=update_payload)
    assert r_update.status_code == 200, f"Failed to update expense: {r_update.status_code} {r_update.text}"
    updated_data = r_update.json()
    assert updated_data["amount"] == 49.99
    assert updated_data["description"] == "Physics Lab Manual & Safety Goggles"
    print("PUT update succeeded:", updated_data["description"], f"${updated_data['amount']}")

    print(f"\n--- 8. Testing DELETE /api/expenses/{created_id} ---")
    r_del = client.delete(f"/api/expenses/{created_id}")
    assert r_del.status_code == 204, f"Failed DELETE: {r_del.status_code}"
    print(f"DELETE status {r_del.status_code} (204 No Content) succeeded")

    print(f"\n--- 9. Verifying 404 for deleted expense ---")
    r_check = client.get(f"/api/expenses/{created_id}")
    assert r_check.status_code == 404, f"Expected 404, got {r_check.status_code}"
    print("GET after delete returned 404 NOT FOUND as expected")

    print("\n--- 10. Testing Validation Errors ---")
    # Negative amount
    r_invalid_amt = client.post("/api/expenses", json={
        "amount": -15.0,
        "description": "Negative Test",
        "category": "Food",
        "date": "2026-10-04"
    })
    assert r_invalid_amt.status_code == 422, f"Expected 422 for negative amount, got {r_invalid_amt.status_code}"
    print("Negative amount correctly rejected with 422 Unprocessable Entity")

    # Empty description
    r_empty_desc = client.post("/api/expenses", json={
        "amount": 25.0,
        "description": "   ",
        "category": "Food",
        "date": "2026-10-04"
    })
    assert r_empty_desc.status_code == 422, f"Expected 422 for empty description, got {r_empty_desc.status_code}"
    print("Empty description correctly rejected with 422 Unprocessable Entity")

    print("\n--- 11. Testing Analytics & Budget Endpoints ---")
    r_analytics = client.get("/api/analytics/dashboard")
    assert r_analytics.status_code == 200
    print("Analytics Dashboard OK! Total spent:", r_analytics.json().get("totalSpent"))

    r_budget = client.get("/api/budgets")
    assert r_budget.status_code == 200
    print("Budgets endpoint OK! Monthly Total:", r_budget.json().get("monthlyTotal"))

    print("\n==============================================")
    print("ALL CRUD, CORS, AND POSTGRESQL TESTS PASSED! SUCCESS!")
    print("==============================================")

if __name__ == "__main__":
    test_full_crud()
