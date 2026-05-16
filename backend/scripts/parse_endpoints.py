import os
import re

def parse_endpoint_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the prefix if any
    prefix_match = re.search(r'router\s*=\s*APIRouter\((?:prefix="([^"]+)")?', content)
    prefix = prefix_match.group(1) if prefix_match and prefix_match.group(1) else ""

    endpoints = []
    # Regex to catch @router.get/post/put/delete... and the function following it
    # This is a simplified parser
    pattern = re.compile(r'@router\.(get|post|put|delete|patch)\("([^"]+)"[^\)]*\)\s*(?:@[^\n]+\n\s*)*async def (\w+)\((.*?)\):(?:\s+"""(.*?)""")?', re.DOTALL)
    
    for match in pattern.finditer(content):
        method = match.group(1).upper()
        path = prefix + match.group(2)
        func_name = match.group(3)
        args = match.group(4)
        docstring = match.group(5).strip() if match.group(5) else "No description"
        
        # Look for roles in the arguments
        roles = "Any authenticated user"
        role_match = re.search(r'require_roles\(\[([^\]]+)\]\)', args)
        if role_match:
            roles = role_match.group(1).replace('UserRole.', '').replace(' ', '')
        elif 'get_current_superuser' in args:
            roles = "Superuser only"
        elif 'get_current_user' in args or 'get_current_active_user' in args:
            roles = "Authenticated User"
            
        endpoints.append({
            "Module": os.path.basename(filepath),
            "Method": method,
            "Path": path,
            "Roles": roles,
            "Action": docstring.split('\n')[0]
        })
    return endpoints

def main():
    directory = r'c:\External-projects\WinVinaya\winvinaya-crm\backend\app\api\v1\endpoints'
    all_endpoints = []
    for filename in os.listdir(directory):
        if filename.endswith('.py') and filename != '__init__.py':
            all_endpoints.extend(parse_endpoint_file(os.path.join(directory, filename)))

    # Sort by Module and then Path
    all_endpoints.sort(key=lambda x: (x['Module'], x['Path']))

    print("| Module | Method | Path | Roles | Action |")
    print("| --- | --- | --- | --- | --- |")
    for row in all_endpoints:
        print(f"| {row['Module']} | {row['Method']} | {row['Path']} | {row['Roles']} | {row['Action']} |")

if __name__ == "__main__":
    main()
