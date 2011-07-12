
import subprocess

class Query:
	def __init__(self, it):
		self._it = it

	def __iter__(self):
		return self._it

	def where(self, f):
		return Query(n for n in self._it if f(n))

	def select(self, f):
		return Query(f(n) for n in self._it)

	def tolist(self):
		return list(self._it)

	def totuple(self):
		return tuple(self._it)


gitLsFiles = subprocess.Popen(['git', 'ls-files'], stdout=subprocess.PIPE)
files = (Query(gitLsFiles.stdout)
	.select(lambda fn: fn.strip())
	.where(lambda fn: fn[0] != '.')
	.where(lambda fn: fn != 'SConstruct'))

Command('a.zip', files.tolist(), 'zip $TARGET $SOURCES')

