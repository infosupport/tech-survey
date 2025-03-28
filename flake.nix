{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    devenv.url = "github:cachix/devenv";
  };
  
  outputs = { self, nixpkgs, devenv, systems, ... } @ inputs:
let
      forEachSystem = nixpkgs.lib.genAttrs (import systems);

    in
    {
      packages = forEachSystem (system: {
        devenv-up = self.devShells.${system}.default.config.procfileScript;
      });

      devShells = forEachSystem
        (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
            upkgs = import inputs.nixpkgs-unstable { system = system; };
          in
          {
            default = 
              devenv.lib.mkShell {
                inherit inputs pkgs;
                modules = [
                  ({ pkgs, config, ... }:
                    {
                      # https://devenv.sh/basics/
                      # dotenv.enable = false;

                      env = {
                        PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma-engines}/lib/libquery_engine.node";
                        PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
                        PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
                        PLAYWRIGHT_BROWSERS_PATH = "${upkgs.playwright-driver.browsers}";
                        PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
                        PLAYWRIGHT_NODEJS_PATH = "${pkgs.nodejs}/bin/node";
                        PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = "${upkgs.playwright.browsers}/chromium-1134/chrome-linux/chrome";
                      };

                      # https://devenv.sh/packages/
                      packages = [
                        pkgs.git
                        pkgs.openssl
                        upkgs.playwright
                      ];

                      # https://devenv.sh/scripts/
                      # Create the initial AVD that's needed by the emulator
                      #scripts.<name-placeholder>.exec = "";
                      scripts.logindb.exec = "psql \"tech-survey\" -U ${builtins.getEnv "DB_USER"}";

                      # https://devenv.sh/processes/
                      # These processes will all run whenever we run `devenv run`
                      # processes.<name-placeholder>.exec = "";

                      enterShell = ''
                        if [ ! -f .env ]; then
                            echo "Generating new .env file based on .env.example..."
                            cp .env.example .env
                            ${pkgs.gnused}/bin/sed -i "s/dummyusr/$(head /dev/urandom | tr -dc a-z | head -c 13)/g" .env
                            ${pkgs.gnused}/bin/sed -i "s/dummypw/$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 20)/g" .env
                            secret=$(${pkgs.openssl}/bin/openssl rand -base64 32)
                            ${pkgs.gnused}/bin/sed -i "s/AUTH_SECRET=\"dummy\"/AUTH_SECRET=\"$secret\"/g" .env
                            echo ".env file created"
                        fi
                      '';

                      # https://devenv.sh/languages/
                      languages.javascript = {
                        enable = true;
                        npm.enable = true;
                        yarn.enable = true;
                        corepack.enable = true;
                      };
                      
                      # https://devenv.sh/services/
                      services.postgres = {
                        enable = true;
                        listen_addresses = "127.0.0.1";
                        initialScript = "CREATE DATABASE tech_survey; CREATE ROLE ${builtins.getEnv "DB_USER"} LOGIN PASSWORD '${builtins.getEnv "DB_PASSWORD"}' SUPERUSER; GRANT ALL PRIVILEGES ON DATABASE tech_survey TO ${builtins.getEnv "DB_USER"};";
                      };

                      # See full reference at https://devenv.sh/reference/options/
                    })
                ];
              };
          });
    };
}
