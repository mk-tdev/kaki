"""Add the API and private network to the existing disposable resource group.
Safe to rerun after an interrupted provisioning; does not disable DB public access.
"""
import json, os, pathlib, secrets, subprocess
root=pathlib.Path(__file__).resolve().parents[2]
file=root/'.env.azure.local'
env=dict(line.split('=',1) for line in file.read_text().splitlines() if '=' in line and not line.startswith('#'))
rg=env['AZURE_RESOURCE_GROUP']; server=env['AZURE_POSTGRES_SERVER']; sub=env['AZURE_SUBSCRIPTION_ID']
app=env.get('AZURE_API_APP','kaki-api-'+server.removeprefix('kaki-pg-'))
vnet='vnet-kaki-api';plan='plan-kaki-api';zone='privatelink.postgres.database.azure.com'

def az(*args):
 r=subprocess.run(['az',*args,'--subscription',sub,'--only-show-errors','-o','json'],capture_output=True,text=True)
 if r.returncode: raise SystemExit(r.stderr)
 return json.loads(r.stdout) if r.stdout.strip() else None

def ensure(resource_type,name,command):
 existing=az('resource','list','--resource-group',rg,'--resource-type',resource_type,'--name',name)
 if not existing:
  print('Creating '+name,flush=True);return az(*command)
 return existing[0]

ensure('Microsoft.Network/virtualNetworks',vnet,('network','vnet','create','-g',rg,'-n',vnet,'-l','southeastasia','--address-prefixes','10.42.0.0/16'))
az('network','vnet','subnet','create','-g',rg,'--vnet-name',vnet,'-n','api-integration','--address-prefixes','10.42.0.0/24','--delegations','Microsoft.Web/serverFarms')
az('network','vnet','subnet','create','-g',rg,'--vnet-name',vnet,'-n','database-endpoint','--address-prefixes','10.42.1.0/24')
ensure('Microsoft.Network/privateDnsZones',zone,('network','private-dns','zone','create','-g',rg,'-n',zone))
links=az('network','private-dns','link','vnet','list','-g',rg,'-z',zone)
if not any(x['name']=='kaki-vnet-link' for x in links):
 az('network','private-dns','link','vnet','create','-g',rg,'-z',zone,'-n','kaki-vnet-link','--virtual-network',vnet,'--registration-enabled','false')
pg_id=f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.DBforPostgreSQL/flexibleServers/{server}'
ensure('Microsoft.Network/privateEndpoints','pe-kaki-postgres',('network','private-endpoint','create','-g',rg,'-n','pe-kaki-postgres','-l','southeastasia','--vnet-name',vnet,'--subnet','database-endpoint','--private-connection-resource-id',pg_id,'--group-id','postgresqlServer','--connection-name','kaki-postgres'))
zone_id=f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/privateDnsZones/{zone}'
az('network','private-endpoint','dns-zone-group','create','-g',rg,'--endpoint-name','pe-kaki-postgres','-n','default','--private-dns-zone',zone_id,'--zone-name','postgres')
ensure('Microsoft.Web/serverfarms',plan,('appservice','plan','create','-g',rg,'-n',plan,'-l','southeastasia','--is-linux','--sku','B1'))
ensure('Microsoft.Web/sites',app,('webapp','create','-g',rg,'-n',app,'--plan',plan,'--runtime','NODE:24-lts','--https-only','true'))
az('webapp','vnet-integration','add','-g',rg,'-n',app,'--vnet',vnet,'--subnet','api-integration')
az('webapp','config','set','-g',rg,'-n',app,'--always-on','true','--min-tls-version','1.2','--ftps-state','Disabled','--startup-file','node dist/main.js')
info=az('webapp','show','-g',rg,'-n',app)
updates={'AZURE_API_APP':app,'API_BASE_URL':'https://'+info['defaultHostName'],'API_BRIDGE_KEY':env.get('API_BRIDGE_KEY') or secrets.token_urlsafe(48)}
with file.open('a') as f:
 for key,value in updates.items():
  if key not in env:f.write(f'{key}={value}\n')
os.chmod(file,0o600)
print(f'API infrastructure ready: {updates["API_BASE_URL"]}. Database public access remains unchanged until private connectivity is verified.',flush=True)
