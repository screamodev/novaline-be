#=========================================================================#
# NovaLine (Docker) — HTTP. Copy to /usr/local/hestia/data/templates/web/nginx/
# Everything is redirected to HTTPS by nginx.forcessl.conf (Let's Encrypt
# challenges are still served through the nginx.conf_* includes).
#=========================================================================#

server {
	listen      %ip%:%proxy_port%;
	server_name %domain_idn% %alias_idn%;
	error_log   /var/log/%web_system%/domains/%domain%.error.log error;

	include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

	location ~ /\.(?!well-known\/|file) {
		deny all;
		return 404;
	}

	location / {
		proxy_pass http://127.0.0.1:3100;
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}

	include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
