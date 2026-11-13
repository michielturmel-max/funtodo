#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SRC_DIR/manifest.json"
PLUGINS_DIR="${OMARCHY_PLUGINS_DIR:-$HOME/.config/omarchy/plugins}"
BACKUP_DIR="$HOME/.config/omarchy/plugin-backups"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "funtodo: '$1' ontbreekt" >&2
    exit 1
  }
}

need omarchy
need jq
need python3

ID="$(jq -r '.id // empty' "$MANIFEST")"
if [ -z "$ID" ]; then
  echo "funtodo: manifest.json heeft geen id" >&2
  exit 1
fi

STAGE=""
cleanup() {
  if [ -n "${STAGE:-}" ]; then rm -rf "$STAGE"; fi
}
trap cleanup EXIT

install_plugin() {
  omarchy plugin validate "$SRC_DIR"

  STAGE="$PLUGINS_DIR/.$ID.install.$$"
  mkdir -p "$STAGE"
  cp -a "$SRC_DIR/manifest.json" "$SRC_DIR/Panel.qml" "$SRC_DIR/bin" "$STAGE/"
  find "$STAGE" -type d -name __pycache__ -prune -exec rm -rf {} +
  find "$STAGE" -type f -name '*.pyc' -delete
  chmod +x "$STAGE"/bin/*

  python3 -m py_compile "$STAGE/bin/funtodo"
  rm -rf "$STAGE/bin/__pycache__"

  if [ -d "$PLUGINS_DIR/$ID" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -a "$PLUGINS_DIR/$ID" "$BACKUP_DIR/$ID-$(date +%Y%m%d-%H%M%S)"
    rm -rf "$PLUGINS_DIR/$ID"
  fi

  mv "$STAGE" "$PLUGINS_DIR/$ID"
  STAGE=""
  trap - EXIT

  omarchy-shell shell rescanPlugins >/dev/null 2>&1 || true

  local enabled=0
  for _ in $(seq 1 40); do
    if omarchy plugin list --json 2>/dev/null \
      | jq -e --arg id "$ID" 'any(.[]; .id == $id and .enabled)' >/dev/null 2>&1; then
      enabled=1
      break
    fi
    sleep 0.05
  done

  if [ "$enabled" -eq 0 ]; then
    omarchy plugin enable "$ID" "$(jq -r '.barWidget.defaultSection // "right"' "$MANIFEST")"
  fi

  echo "Funtodo staat in de balk."
  if [ ! -f "$HOME/.config/funtodo/plugin.json" ]; then
    echo "Nog geen token. Maak er een op http://127.0.0.1:3000/profiel of run:"
    echo "  $PLUGINS_DIR/$ID/bin/funtodo login"
  fi
}

case "${1:-install}" in
  install)
    install_plugin
    ;;
  version)
    echo "bron:          $(jq -r '.version' "$MANIFEST")"
    echo "geinstalleerd: $(jq -r '.version // "?"' "$PLUGINS_DIR/$ID/manifest.json" 2>/dev/null || echo '?')"
    ;;
  uninstall)
    if omarchy plugin list --json 2>/dev/null | jq -e --arg id "$ID" 'any(.[]; .id == $id)' >/dev/null; then
      omarchy plugin remove "$ID" --yes
    fi
    echo "Verwijderd. Je token staat nog in $HOME/.config/funtodo/plugin.json."
    ;;
  *)
    echo "gebruik: $0 [install|version|uninstall]" >&2
    exit 2
    ;;
esac
