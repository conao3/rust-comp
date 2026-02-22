# Makefile for rust-comp (comp - local diff viewer)

INSTALL_DIR ?= $(HOME)/.local/bin
BINARY = src-tauri/target/release/comp

.PHONY: all build install uninstall dev check clean

all: build

## Build release binary
build:
	pnpm install
	pnpm tauri build

## Run dev server (hot reload)
dev:
	pnpm tauri dev

## Type check TypeScript + Rust
check:
	pnpm tsc --noEmit
	cd src-tauri && cargo check

## Run Rust tests
test:
	cd src-tauri && cargo test

## Install binary to INSTALL_DIR (default: ~/.local/bin)
install: build
	@mkdir -p $(INSTALL_DIR)
	cp $(BINARY) $(INSTALL_DIR)/comp
	@echo "✓ Installed: $(INSTALL_DIR)/comp"
	@echo "  Make sure $(INSTALL_DIR) is in your PATH"

## Uninstall
uninstall:
	rm -f $(INSTALL_DIR)/comp
	@echo "✓ Uninstalled"

## Clean build artifacts
clean:
	rm -rf dist
	cd src-tauri && cargo clean
