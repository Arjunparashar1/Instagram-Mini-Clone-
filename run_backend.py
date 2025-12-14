"""
Alternative entry point to run the Flask backend from the root directory.
Usage: python run_backend.py
"""
from backend.app import create_app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

