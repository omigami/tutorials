import requests
from flask import Flask, render_template, request, jsonify

from graphbuilder import get_graph_data

app = Flask(__name__)

@app.route("/")
def main():
    print("main()")
    spectrum_id = request.args.get("spectrum_id")
    print(spectrum_id)
    print("asdf")
    if not spectrum_id:
        return render_template("index.html", run=False)

    url = f'https://files.omigami.com/gnps/{spectrum_id}.mgf'
    mgfdata = requests.get(url).text
    with open("sample.mgf", "w") as f:
        f.write(mgfdata)
    return render_template("index.html", run=True)

@app.route("/data")
def get_data():
    # jnns = [{"id": "a"}, {"id": "b"}, {"id": "c"}];
    # lls = [{"similarity": "0.5", "source": 0, "target": 1}, {"similarity": "0.2", "source": 0, "target": 2}]
    # data = {"nns": nns, "lls": lls}
    data = get_graph_data()
    return jsonify(data)

if __name__ == "__main__":
    print("running")
    app.run(port=1338)
