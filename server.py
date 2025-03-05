from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add security and CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Opener-Policy', 'unsafe-none')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = HTTPServer(('', port), CORSRequestHandler)
    print(f'Serving on port {port}...')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        server.server_close() 