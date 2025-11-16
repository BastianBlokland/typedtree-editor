{
  description = "TypedTree-Editor Nix Dev Environment";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-25.05";
  };

  outputs = { nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; config.allowUnfree = true; };
  in
  {
    devShells.${system}.default = pkgs.mkShell {
      packages = [
        pkgs.gnumake
        pkgs.nodejs_24
        pkgs.lsof
        pkgs.google-chrome
      ];

      PUPPETEER_SKIP_DOWNLOAD = true;
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true;
    };

  };
}
