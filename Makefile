OUTFILE=./xmpptk.js
DEPSFILE=./deps.js

all: clean deps build

build: 
	@echo "building xmpptk";
	@./lib/closure-library/closure/bin/build/closurebuilder.py --root=lib/closure-library/ --root=src/ --namespace="xmpptk" --output_mode=compiled --compiler_jar=utils/compiler/compiler.jar > $(OUTFILE)

clean:
	@rm -f $(OUTFILE) 2> /dev/null
	@rm -f $(DEPSFILE) 2> /dev/null

deps:
	@echo "building dependencies";
	@./lib/closure-library/closure/bin/build/depswriter.py --root_with_prefix="./src ../../../../src/" > $(DEPSFILE)
