"""Create an isolated Azure PostgreSQL pilot; secrets stay in .env.azure.local."""
import json, os, pathlib, secrets, subprocess, urllib.parse, urllib.request
root = pathlib.Path(__file__).resolve().parents[2]
output = root / '.env.azure.local'
if output.exists():
    raise SystemExit('.env.azure.local already exists; refusing to replace credentials. Resume using the setup guide.')
rg = 'rg-kaki-azure-pilot'
server = 'kaki-pg-' + secrets.token_hex(4)
admin_password = secrets.token_urlsafe(36)
app_password = secrets.token_urlsafe(36)

def az(*args):
    result = subprocess.run(['az', *args, '--only-show-errors', '-o', 'json'], capture_output=True, text=True)
    if result.returncode:
        message = result.stderr.replace(admin_password, '[redacted]').replace(app_password, '[redacted]')
        raise SystemExit(message)
    return json.loads(result.stdout) if result.stdout.strip() else None

account = az('account', 'show')
if az('group', 'exists', '--name', rg):
    raise SystemExit(f'{rg} already exists; inspect it before provisioning.')
az('group', 'create', '--name', rg, '--location', 'southeastasia', '--tags', 'app=kaki', 'purpose=disposable-pilot')
# Save before provisioning so failed/slow runs can be resumed without losing credentials.
host = server + '.postgres.database.azure.com'
def url(user, password):
    return f'postgresql://{user}:{urllib.parse.quote(password, safe="")}@{host}:5432/kaki'
content = '\n'.join([
    f'AZURE_SUBSCRIPTION_ID={account["id"]}', f'AZURE_RESOURCE_GROUP={rg}', f'AZURE_POSTGRES_SERVER={server}',
    f'DATABASE_ADMIN_URL={url("kakiadmin", admin_password)}', f'DATABASE_URL={url("kaki_app", app_password)}',
    'DATABASE_POOL_MAX=3', f'AUTH_INVITE_CODE={secrets.token_urlsafe(24)}', 'APP_ORIGIN=http://localhost:5026', ''
])
fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as f: f.write(content)
print(f'Creating {server} in {rg}; credentials saved privately to .env.azure.local.', flush=True)
az('postgres', 'flexible-server', 'create', '--resource-group', rg, '--name', server,
   '--location', 'southeastasia', '--admin-user', 'kakiadmin', '--admin-password', admin_password,
   '--tier', 'Burstable', '--sku-name', 'Standard_B1ms', '--version', '17', '--storage-size', '32',
   '--backup-retention', '7', '--geo-redundant-backup', 'Disabled', '--public-access', 'None', '--yes')
az('postgres', 'flexible-server', 'update', '--resource-group', rg, '--name', server, '--public-access', 'Enabled')
az('postgres', 'flexible-server', 'db', 'create', '--resource-group', rg, '--server-name', server, '--name', 'kaki')
with urllib.request.urlopen('https://api.ipify.org', timeout=20) as response: address = response.read().decode().strip()
import ipaddress
ipaddress.IPv4Address(address)
az('postgres', 'flexible-server', 'firewall-rule', 'create', '--resource-group', rg, '--server-name', server,
   '--name', 'developer-current-ip', '--start-ip-address', address, '--end-ip-address', address)
print(f'Ready: {rg} / {server}. Only this developer IP is allowed; configure Vercel egress separately.')
