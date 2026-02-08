import argparse
import json
import os
import shlex
import subprocess
import sys
import time
from datetime import datetime

from M_app.M_Src_Backend import cruds
from M_app.M_Src_Backend.db import db_session, init_db


def _print(obj):
    if isinstance(obj, (list, dict)):
        print(json.dumps(obj, ensure_ascii=False, default=str))
    else:
        print(obj)


def _set_password(db, user_id: int, password: str):
    salt, password_hash = cruds.hash_password(password)
    return cruds.update_user(db, user_id, {"password_salt": salt, "password_hash": password_hash})


def cmd_init_db(args):
    init_db()
    _print("ok")


def cmd_create_admin(args):
    with db_session() as db:
        user = cruds.get_user_by_username(db, args.username)
        if user is None:
            user = cruds.create_user_with_password(
                db,
                username=args.username,
                password=args.password,
                email=args.email,
                role="admin",
                display_name=args.display_name,
            )
        else:
            _set_password(db, user.id, args.password)
            user = cruds.update_user(db, user.id, {"role": "admin", "is_active": True})
        _print({"id": user.id, "username": user.username, "role": user.role})


def cmd_create_user(args):
    with db_session() as db:
        user = cruds.create_user_with_password(
            db,
            username=args.username,
            password=args.password,
            email=args.email,
            role=args.role,
            display_name=args.display_name,
        )
        _print({"id": user.id, "username": user.username, "role": user.role})


def cmd_list_users(args):
    with db_session() as db:
        users = cruds.get_all_users(db, limit=args.limit, offset=args.offset)
        _print(
            [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "role": u.role,
                    "level": u.level,
                    "xp": u.xp,
                    "is_active": u.is_active,
                    "created_at": u.created_at,
                }
                for u in users
            ]
        )


def cmd_ban_user(args):
    with db_session() as db:
        user = cruds.update_user(db, args.user_id, {"is_active": False})
        _print({"ok": bool(user)})


def cmd_unban_user(args):
    with db_session() as db:
        user = cruds.update_user(db, args.user_id, {"is_active": True})
        _print({"ok": bool(user)})


def cmd_set_role(args):
    with db_session() as db:
        user = cruds.update_user(db, args.user_id, {"role": args.role})
        _print({"ok": bool(user)})


def cmd_set_level(args):
    with db_session() as db:
        user = cruds.set_user_level(db, args.user_id, args.level)
        _print({"ok": bool(user)})


def cmd_add_xp(args):
    with db_session() as db:
        user = cruds.add_xp(db, args.user_id, args.xp)
        _print({"ok": bool(user)})


def cmd_reset_password(args):
    with db_session() as db:
        user = _set_password(db, args.user_id, args.password)
        _print({"ok": bool(user)})


def cmd_delete_user(args):
    with db_session() as db:
        ok = cruds.delete_user(db, args.user_id)
        _print({"ok": ok})


def cmd_list_sessions(args):
    with db_session() as db:
        sessions = cruds.get_sessions_by_user(db, args.user_id)
        _print(
            [
                {
                    "id": s.id,
                    "token": s.token,
                    "created_at": s.created_at,
                    "expires_at": s.expires_at,
                    "revoked": s.revoked,
                }
                for s in sessions
            ]
        )


def cmd_revoke_session(args):
    with db_session() as db:
        if args.token:
            ok = cruds.revoke_session(db, args.token)
            _print({"ok": ok})
        else:
            count = cruds.revoke_sessions_by_user(db, args.user_id)
            _print({"revoked": count})


def cmd_list_activity(args):
    with db_session() as db:
        logs = cruds.get_activity_logs(db, limit=args.limit, offset=args.offset, user_id=args.user_id)
        _print(
            [
                {
                    "id": l.id,
                    "user_id": l.user_id,
                    "action": l.action,
                    "details": l.details,
                    "points_delta": l.points_delta,
                    "created_at": l.created_at,
                }
                for l in logs
            ]
        )


def cmd_list_requests(args):
    with db_session() as db:
        logs = cruds.get_request_logs(
            db,
            limit=args.limit,
            offset=args.offset,
            user_id=args.user_id,
            method=args.method,
            path=args.path,
        )
        _print(
            [
                {
                    "id": l.id,
                    "user_id": l.user_id,
                    "method": l.method,
                    "path": l.path,
                    "status": l.status_code,
                    "ip": l.ip,
                    "duration_ms": l.duration_ms,
                    "created_at": l.created_at,
                }
                for l in logs
            ]
        )


def cmd_watch_requests(args):
    last_id = args.since_id or 0
    while True:
        with db_session() as db:
            logs = cruds.get_request_logs(db, limit=args.limit, since_id=last_id)
        if logs:
            logs_sorted = sorted(logs, key=lambda x: x.id)
            for l in logs_sorted:
                _print(
                    {
                        "id": l.id,
                        "user_id": l.user_id,
                        "method": l.method,
                        "path": l.path,
                        "status": l.status_code,
                        "ip": l.ip,
                        "duration_ms": l.duration_ms,
                        "created_at": l.created_at,
                    }
                )
            last_id = logs_sorted[-1].id
        time.sleep(args.interval)


def cmd_watch_activity(args):
    last_id = args.since_id or 0
    while True:
        with db_session() as db:
            logs = cruds.get_activity_logs(db, limit=args.limit, offset=0, user_id=args.user_id)
        if logs:
            logs_sorted = sorted([l for l in logs if l.id > last_id], key=lambda x: x.id)
            for l in logs_sorted:
                _print(
                    {
                        "id": l.id,
                        "user_id": l.user_id,
                        "action": l.action,
                        "details": l.details,
                        "points_delta": l.points_delta,
                        "created_at": l.created_at,
                    }
                )
            if logs_sorted:
                last_id = logs_sorted[-1].id
        time.sleep(args.interval)


def cmd_help(args):
    parser = build_parser()
    _print(parser.format_help())


def cmd_shell(args):
    parser = build_parser()
    while True:
        try:
            line = input("manage> ").strip()
        except EOFError:
            break
        if not line:
            continue
        if line in ("exit", "quit"):
            break
        if line == "help":
            _print(parser.format_help())
            continue
        parts = shlex.split(line)
        if not parts:
            continue
        try:
            parsed = parser.parse_args(parts)
            parsed.func(parsed)
        except SystemExit:
            continue


def cmd_start_project(args):
    root = os.path.abspath(os.path.dirname(__file__))
    backend_cmd = [sys.executable, os.path.join(root, "main.py")]
    frontend_cmd = ["npm", "start"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root)
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=os.path.join(root, "invest-uz"))
    _print(
        {
            "backend_pid": backend_proc.pid,
            "frontend_pid": frontend_proc.pid,
        }
    )


def build_parser():
    parser = argparse.ArgumentParser(prog="manage.py")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("init-db")
    p.set_defaults(func=cmd_init_db)

    p = sub.add_parser("create-admin")
    p.add_argument("--username", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--email")
    p.add_argument("--display-name")
    p.set_defaults(func=cmd_create_admin)

    p = sub.add_parser("create-user")
    p.add_argument("--username", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--email")
    p.add_argument("--role", default="user")
    p.add_argument("--display-name")
    p.set_defaults(func=cmd_create_user)

    p = sub.add_parser("list-users")
    p.add_argument("--limit", type=int, default=200)
    p.add_argument("--offset", type=int, default=0)
    p.set_defaults(func=cmd_list_users)

    p = sub.add_parser("ban-user")
    p.add_argument("--user-id", type=int, required=True)
    p.set_defaults(func=cmd_ban_user)

    p = sub.add_parser("unban-user")
    p.add_argument("--user-id", type=int, required=True)
    p.set_defaults(func=cmd_unban_user)

    p = sub.add_parser("set-role")
    p.add_argument("--user-id", type=int, required=True)
    p.add_argument("--role", required=True)
    p.set_defaults(func=cmd_set_role)

    p = sub.add_parser("set-level")
    p.add_argument("--user-id", type=int, required=True)
    p.add_argument("--level", type=int, required=True)
    p.set_defaults(func=cmd_set_level)

    p = sub.add_parser("add-xp")
    p.add_argument("--user-id", type=int, required=True)
    p.add_argument("--xp", type=int, required=True)
    p.set_defaults(func=cmd_add_xp)

    p = sub.add_parser("reset-password")
    p.add_argument("--user-id", type=int, required=True)
    p.add_argument("--password", required=True)
    p.set_defaults(func=cmd_reset_password)

    p = sub.add_parser("delete-user")
    p.add_argument("--user-id", type=int, required=True)
    p.set_defaults(func=cmd_delete_user)

    p = sub.add_parser("list-sessions")
    p.add_argument("--user-id", type=int, required=True)
    p.set_defaults(func=cmd_list_sessions)

    p = sub.add_parser("revoke-session")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--token")
    g.add_argument("--user-id", type=int)
    p.set_defaults(func=cmd_revoke_session)

    p = sub.add_parser("list-activity")
    p.add_argument("--user-id", type=int)
    p.add_argument("--limit", type=int, default=200)
    p.add_argument("--offset", type=int, default=0)
    p.set_defaults(func=cmd_list_activity)

    p = sub.add_parser("list-requests")
    p.add_argument("--user-id", type=int)
    p.add_argument("--method")
    p.add_argument("--path")
    p.add_argument("--limit", type=int, default=200)
    p.add_argument("--offset", type=int, default=0)
    p.set_defaults(func=cmd_list_requests)

    p = sub.add_parser("watch-requests")
    p.add_argument("--interval", type=float, default=1.0)
    p.add_argument("--limit", type=int, default=200)
    p.add_argument("--since-id", type=int, default=0)
    p.set_defaults(func=cmd_watch_requests)

    p = sub.add_parser("watch-activity")
    p.add_argument("--interval", type=float, default=1.0)
    p.add_argument("--limit", type=int, default=200)
    p.add_argument("--since-id", type=int, default=0)
    p.add_argument("--user-id", type=int)
    p.set_defaults(func=cmd_watch_activity)

    p = sub.add_parser("help")
    p.set_defaults(func=cmd_help)

    p = sub.add_parser("shell")
    p.set_defaults(func=cmd_shell)

    p = sub.add_parser("start-project")
    p.set_defaults(func=cmd_start_project)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
