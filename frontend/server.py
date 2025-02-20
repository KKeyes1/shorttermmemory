from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

# Change to the public directory containing the reminder app files
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public'))

# Create server
server_address = ('', 8000)
httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
print('Server running on port 8000...')
httpd.serve_forever() 