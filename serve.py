import http.server
import socketserver
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print(f"Preview: http://localhost:{PORT}/preview.html")
    httpd.serve_forever()
