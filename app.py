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


# interface
from flask import send_file
import csv
import io

@app.route("/historico")
def historico():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, bpm, beats, accuracy, avg_error, min_error, max_error, timestamp 
        FROM treinos ORDER BY timestamp DESC
    """)
    treinos = cursor.fetchall()
    conn.close()

    return render_template("historico.html", treinos=treinos)

@app.route("/exportar_csv")
def exportar_csv():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, bpm, beats, accuracy, avg_error, min_error, max_error, timestamp 
        FROM treinos ORDER BY timestamp DESC
    """)
    treinos = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id","bpm","beats","accuracy","avg_error","min_error","max_error","timestamp"])

    for t in treinos:
        writer.writerow(t)

    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name="historico_treinos.csv"
    )

# interface

# grafico
@app.route("/grafico")
def grafico():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT accuracy, avg_error, timestamp FROM treinos ORDER BY timestamp ASC")
    dados = cursor.fetchall()
    conn.close()

    return render_template("grafico.html", dados=dados)

# grafico