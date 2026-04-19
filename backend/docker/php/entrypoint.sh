#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Entrypoint for the Laravel app container.
#
# When a bind mount (./backend:/var/www/html) is used for development, it
# overwrites the image filesystem — including the ownership set during the
# Docker build.  PHP-FPM runs as www-data, so we must ensure the directories
# Laravel needs to write to are writable by that user.
# ---------------------------------------------------------------------------

# Directories Laravel must be able to write to at runtime
chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

chmod -R 775 \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

# Hand off to the CMD (supervisord by default)
exec "$@"
