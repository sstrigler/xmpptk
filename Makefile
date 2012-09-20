BUILDDIR  = ./htdocs
SOURCEDIR = ./src

OUTFILE   = $(BUILDDIR)/chat.js
DEPSFILE  = $(BUILDDIR)/deps.js
JSJACFILE = $(BUILDDIR)/jsjac.js

all: clean deps jsjac build

install:
	@echo "done."

build:
	@echo "building chat";
	@./lib/closure-library/closure/bin/build/closurebuilder.py --root=lib/closure-library/ --root=$(SOURCEDIR) --namespace="chat" --output_mode=compiled -f '--compilation_level=ADVANCED_OPTIMIZATIONS' -f '--externs=externs.js' -f '--define=goog.DEBUG=false' --compiler_jar=utils/compiler/compiler.jar > $(OUTFILE)

jsjac:
	@echo "building jsjac";
	@make -C lib/jsjac clean utils build crunch;
	@cp lib/jsjac/jsjac.js $(JSJACFILE)

clean:
	@rm -f $(OUTFILE) 2> /dev/null
	@rm -f $(DEPSFILE) 2> /dev/null
	@rm -f $(JSJACFILE) 2> /dev/null

deps:
	@echo "building dependencies";
	@./lib/closure-library/closure/bin/build/depswriter.py --root_with_prefix="$(SOURCEDIR) ../../../../src/" > $(DEPSFILE)
