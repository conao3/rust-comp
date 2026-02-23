{
  description = "rust-comp: local diff viewer with Tauri + React";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" "aarch64-darwin" ];

      imports = [ inputs.treefmt-nix.flakeModule ];

      perSystem = { lib, system, ... }:
        let
          overlay = final: prev:
            let
              nodejs = prev.nodejs_24;
              pnpm = prev.pnpm_10.override { inherit nodejs; };
            in {
              inherit nodejs pnpm;
            };

          pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ overlay ];
          };

          linuxBuildInputs = with pkgs; [
            webkitgtk_4_1
            gtk3
            libsoup_3
            glib-networking
            openssl
            librsvg
          ];

          darwinBuildInputs = with pkgs; [
            darwin.apple_sdk.frameworks.WebKit
            darwin.apple_sdk.frameworks.AppKit
            darwin.apple_sdk.frameworks.CoreServices
          ];
        in {
          devShells.default = pkgs.mkShell {
            packages = with pkgs;
              [
                rustc
                cargo
                rust-analyzer
                rustfmt
                clippy
                nodejs
                pnpm
              ] ++ lib.optionals stdenv.isLinux [ pkg-config ];

            buildInputs =
              if pkgs.stdenv.isLinux then linuxBuildInputs else darwinBuildInputs;

            env = lib.optionalAttrs pkgs.stdenv.isLinux {
              GIO_MODULE_PATH = "${pkgs.glib-networking}/lib/gio/modules";
            };
          };

          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              nixfmt.enable = true;
              rustfmt.enable = true;
              prettier.enable = true;
            };
            settings.global.excludes = [
              "pnpm-lock.yaml"
              "src-tauri/gen/*"
            ];
          };
        };
    };
}
