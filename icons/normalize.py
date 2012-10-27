import glob, shutil, re

s = re.compile(r"(?P<icon>\w+)")

for f in glob.glob('*.png'):
    simplename = s.match(f).groupdict()
    sim = "%s.png" % simplename['icon']
    if sim != f:
        shutil.copyfile(f, sim)
