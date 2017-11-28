from server import app
from server.services import service_manager

# service_sdk = service_manager.get('service-name')

@app.route('/usecase')
def usecase():
    """usecase route"""
    return 'hello from usecase_route'
