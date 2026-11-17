# Deploying the Habitflower API (AWS EC2)

One `t4g.small` instance (ARM, 2 GB) runs three containers with Docker Compose:
**Caddy** (HTTPS) in front of the **api** (Node + Hono), with **Postgres** on a Docker volume.
Postgres is never exposed to the internet. Backups go to S3 every night.

## 1. AWS resources

1. **S3 bucket** for backups, e.g. `habitflower-backups`. Block all public access, turn on default encryption, and add a lifecycle rule that expires objects after 30 days.
2. **IAM role** for the instance, named `habitflower-ec2`, with this policy (replace the bucket name):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"], "Resource": "arn:aws:s3:::habitflower-backups/*" },
       { "Effect": "Allow", "Action": ["s3:ListBucket"], "Resource": "arn:aws:s3:::habitflower-backups" }
     ]
   }
   ```
3. **Security group** `habitflower-api`, inbound rules:
   | Port | Source | Why |
   |---|---|---|
   | 443 TCP + UDP | 0.0.0.0/0, ::/0 | HTTPS (UDP is for HTTP/3) |
   | 80 TCP | 0.0.0.0/0, ::/0 | Let's Encrypt challenge and redirect to HTTPS |
   | 22 TCP | your IP only | SSH. Better: skip it and use SSM Session Manager |

   Keep outbound open. Do **not** open 5432 or 3000.
4. **EC2 instance**: Amazon Linux 2023 (arm64), `t4g.small`, 20 GB gp3 (encrypted), the security group and IAM role above. Allocate an **Elastic IP** and attach it.
5. **DNS**: an `A` record such as `api.habitflower.app` pointing at the Elastic IP.

## 2. Install on the instance

```bash
sudo dnf update -y
sudo dnf install -y docker git cronie
sudo systemctl enable --now docker crond
sudo usermod -aG docker ec2-user   # log out and back in

# Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-aarch64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

git clone <your repo url> habitflower
cd habitflower/server
cp .env.example .env && chmod 600 .env
```

## 3. Environment variables (`server/.env`)

| Variable | Required | Notes |
|---|---|---|
| `API_DOMAIN` | yes | The DNS name, e.g. `api.habitflower.app`. Caddy gets the certificate for it. |
| `POSTGRES_PASSWORD` | yes | Long random string: `openssl rand -base64 32` |
| `JWT_SECRET` | yes | At least 32 chars: `openssl rand -base64 48`. Changing it signs everyone out. |
| `APPLE_BUNDLE_ID` | yes | The iOS bundle id, the audience of Apple identity tokens (`com.habitflower.app`). |
| `GOOGLE_CLIENT_IDS` | for Google | Comma-separated OAuth client ids (iOS and web) accepted as token audiences. |
| `BACKUP_S3_URI` | for backups | e.g. `s3://habitflower-backups/prod` |

The app side needs `EXPO_PUBLIC_API_URL=https://api.habitflower.app` (see `app/HabitFlower/.env.example`).

## 4. Start

```bash
docker compose up -d --build
docker compose logs -f api        # "migrated 0001_init.sql", then "habitflower api on :3000"
curl https://$API_DOMAIN/health   # {"ok":true}
```

Migrations run automatically when the api starts. Files in `migrations/next/` (the v1.1 social tables) are not applied until you move them into `migrations/`.

**Deploying updates:**
```bash
git pull && docker compose up -d --build api
```

## 5. Nightly Postgres backups to S3

`scripts/backup.sh` streams `pg_dump` through gzip straight to S3, using the instance role (no keys on disk). Add it to cron:

```bash
crontab -e
# 03:15 UTC every night
15 3 * * * /home/ec2-user/habitflower/server/scripts/backup.sh >> /home/ec2-user/backup.log 2>&1
```

Test it once by hand: `./scripts/backup.sh`, then `aws s3 ls $BACKUP_S3_URI/`.

**Restore** (this overwrites the current data):
```bash
./scripts/restore.sh habitflower-2026-11-15T031500Z.sql.gz
```

Run a test restore into a scratch instance now and then. A backup you have never restored is not a backup.

## 6. Operations checklist

- Enable automatic security updates: `sudo dnf install -y dnf-automatic && sudo systemctl enable --now dnf-automatic.timer`.
- Turn on a CloudWatch alarm for instance status checks, plus an uptime check on `/health`.
- EBS snapshots (Data Lifecycle Manager, daily) add a second layer under the S3 dumps.
- Rate limits are in-memory per instance. If you ever run more than one api container, move them to Redis.
- Logs: `docker compose logs --since 1h api`. Caddy logs requests to stdout.

## 7. v1.1 additions (planned)

- **Photos**: an S3 bucket for check-in photos, `POST /v1/photos/presign` returning presigned PUT URLs. Grant the role `s3:PutObject`/`GetObject` on that bucket only.
- **Push**: store Expo push tokens (`push_tokens` table in `migrations/next`) and send through Expo's push service.
- **Friends and feed**: the tables are in `migrations/next/0002_social.sql`.
