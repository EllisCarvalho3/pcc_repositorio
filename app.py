from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
    # import
from flask import request, jsonify
from database import get_db
import datetime

# import

# salvar
@app.route("/save-training", methods=["POST"])
def save_training():
    data = request.json

    db = get_db()
    db.execute("""
        INSERT INTO treinos (bpm, beats, tolerance, accuracy, avg_error, min_error, max_error, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["bpm"],
        data["beats"],
        data["tolerance"],
        data["accuracy"],
        data["avg_error"],
        data["min_error"],
        data["max_error"],
        datetime.datetime.now().isoformat()
    ))
    db.commit()

    return jsonify({"status": "ok"})

# salvar

# listar treinos
@app.route("/history")
def history():
    db = get_db()
    rows = db.execute("SELECT * FROM treinos ORDER BY id DESC").fetchall()

    return jsonify([dict(row) for row in rows])

# listar treinos