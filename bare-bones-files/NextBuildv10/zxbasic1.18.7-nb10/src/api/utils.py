# --------------------------------------------------------------------
# SPDX-License-Identifier: AGPL-3.0-or-later
# © Copyright 2008-2024 José Manuel Rodríguez de la Rosa and contributors.
# See the file CONTRIBUTORS.md for copyright details.
# See https://www.gnu.org/licenses/agpl-3.0.html for details.
# --------------------------------------------------------------------

import contextlib
import errno
import glob
import hashlib
import os
import pathlib
import shelve
import signal
import sys
from collections.abc import Callable, Iterable
from contextlib import contextmanager
from functools import wraps
from typing import IO, Any, TypeVar

from src.api import constants, errmsg, global_

__all__ = (
    "chdir",
    "first",
    "flatten_list",
    "open_file",
    "read_txt_file",
    "sanitize_filename",
    "timeout",
)

__doc__ = """Utils module contains many helpers for several task,
like reading files or path management"""


SHELVE_PATH = os.path.join(constants.ZXBASIC_ROOT, "parsetab", "tabs.dbm")


def _open_shelve(path: str) -> shelve.Shelf:
    """Opens the parser-table cache, discarding it if it is unreadable.

    Which dbm backend shelve picks depends on the interpreter: Python 3.13+
    defaults to dbm.sqlite3, which older interpreters cannot even identify
    ("db type could not be determined"). Running the same checkout under two
    Pythons is normal here (the bundled python/ tree alongside the system one),
    so treat an unreadable cache as a cache miss rather than a hard failure --
    it is only a cache, and it is rebuilt on demand.
    """
    try:
        return shelve.open(path, protocol=5, flag="c")
    except Exception:
        pass

    for stale in glob.glob(f"{path}*"):
        with contextlib.suppress(OSError):
            os.unlink(stale)

    return shelve.open(path, protocol=5, flag="c")


SHELVE = _open_shelve(SHELVE_PATH)

T = TypeVar("T")


def first(iter_: Iterable[T], default: T | None = None) -> T | None:
    """Return the first element of an Iterable, or None if it's empty or
    there are no more elements to return."""
    return next(iter(iter_), default)


def sfirst(iter_: Iterable[T]) -> T:
    """Return the first element of an Iterable, or fails if it's empty"""
    return next(iter(iter_))


def read_txt_file(fname: str) -> str:
    """Reads a txt file, regardless of its encoding"""
    encodings = ["utf-8-sig", "cp1252"]
    with open(fname, "rb") as f:
        content = bytes(f.read())

    for i in encodings:
        try:
            result = content.decode(i)
            return result
        except UnicodeDecodeError:
            pass

    global_.FILENAME = fname
    errmsg.error(1, "Invalid file encoding. Use one of: %s" % ", ".join(encodings))
    return ""


def open_file(fname: str, mode: str = "rb", encoding: str = "utf-8") -> IO[Any]:
    """An open() wrapper for PY2 and PY3 which allows encoding
    :param fname: file name (string)
    :param mode: file mode (string) optional
    :param encoding: optional encoding (string). Ignored in python2 or if not in text mode
    :return: an open file handle
    """
    if "t" not in mode or not encoding:
        return open(fname, mode)

    return open(fname, mode, encoding=encoding)


def sanitize_filename(fname: str) -> str:
    """Given a file name (string) returns it with back-slashes reversed.
    This is to make all BASIC programs compatible in all OSes
    """
    return fname.replace("\\", "/")


def get_absolute_filename_path(fname: str) -> str:
    """Given a filename, if it does not start with '/' or '\', it
    will be returned a given absolute filename path
    """
    return os.path.realpath(os.path.expanduser(fname))


def get_relative_filename_path(fname: str, current_dir: str | None = None) -> str:
    """Given an absolute path, returns it relative to the current directory,
    that is, if the file is in the same folder or any of it children, only
    the path from the current folder onwards is returned. Otherwise, the
    absolute path is returned
    """
    fname_abs = get_absolute_filename_path(fname)
    current_path = get_absolute_filename_path(os.path.curdir if current_dir is None else current_dir)

    if not fname_abs.startswith(current_path):
        return fname_abs

    return fname_abs[len(current_path) :].lstrip(os.path.sep)


def current_data_label() -> str:
    """Returns a data label to which all labels must point to, until
    a new DATA line is declared
    """
    return f"{global_.DATAS_NAMESPACE}.__DATA__{len(global_.DATAS)}"


def flatten_list(x: Iterable[Any], iterables=(list,)) -> list[Any]:
    """Flattens a nested iterable and returns it as a List.
    Nested iterables will be flattened recursively (default only nested lists)
    """
    result = []

    for elem in x:
        if not isinstance(elem, iterables):
            result.append(elem)
        else:
            result.extend(flatten_list(elem))

    return result


def parse_int(num: str | None) -> int | None:
    """Given an integer number, return its value,
    or None if it could not be parsed.
    Allowed formats: DECIMAL, HEXA (0xnnn, $nnnn or nnnnh)
    An hexadecimal number is ambiguous if it starts with a letter (i.e. A0h can be a label),
    and won't be parsed. Such numbers must be prefixed with 0 digit (i.e. 0A0h)
    :param num: (string) the number to be parsed
    :return: an integer number or None if it could not be parsed
    """
    num = (num or "").strip().upper()
    if not num:
        return None

    base = 10
    if num[:2] == "0X":
        base = 16
    elif num[-1] == "H":
        if num[0] not in "0123456789":
            return None
        base = 16
        num = num[:-1]
    elif num[0] == "$":
        base = 16
        num = num[1:]
    elif num[0] == "%":
        base = 2
        num = num[1:]
    elif num[-1] == "B":
        if num[0] not in "01":
            return None
        base = 2
        num = num[:-1]

    try:
        return int(num, base)
    except ValueError:
        pass

    return None


def eval_to_num(expr: str) -> int | float | None:
    """Evaluates the expression and returns the result or None
    if it was non-numeric."""
    try:
        result = eval(expr, {}, {})
    except (NameError, SyntaxError, ValueError):
        return None

    if isinstance(result, int | float):
        return result

    return None


def load_object(key: str) -> Any:
    return SHELVE[key] if key in SHELVE else None


def save_object(key: str, obj: Any) -> Any:
    SHELVE[key] = obj
    SHELVE.sync()
    return obj


# Grammar-hygiene messages PLY emits on every table rebuild. They are a
# maintainer's diagnostic -- the Next opcode tokens are used by the assembler
# grammar and not the BASIC one, and vice versa, which is correct and permanent.
_PLY_NOISE = (
    "defined, but not used",
    "unused token",
    "unused tokens",
    "unused rule",
    "unused rules",
)


class _QuietPlyLogger:
    """PLY error log that drops grammar-hygiene noise and keeps real problems.

    Rebuilding the tables prints two dozen "Token 'NEXTREG' defined, but not
    used" lines and writes a 2.6 MB parser.out. That used to be rare; since the
    table cache learned to notice a changed grammar it happens after every
    compiler update, in front of whoever is compiling a game.

    Only the hygiene warnings are dropped. Shift/reduce and reduce/reduce
    conflicts still come through, because those are how a broken grammar
    announces itself, and errors are untouched. `ZXB_PARSER_DEBUG=1` restores
    everything, parser.out included.
    """

    def __init__(self) -> None:
        from src.ply.yacc import PlyLogger

        self._log = PlyLogger(sys.stderr)

    def debug(self, *args, **kwargs) -> None:
        pass

    info = debug

    def warning(self, msg, *args, **kwargs) -> None:
        if any(noise in msg for noise in _PLY_NOISE):
            return
        self._log.warning(msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs) -> None:
        self._log.error(msg, *args, **kwargs)

    critical = error


def ply_yacc_kwargs() -> dict[str, Any]:
    """Keyword arguments for `yacc.yacc()` that keep an ordinary run quiet.

    See _QuietPlyLogger. Set ZXB_PARSER_DEBUG=1 when working on a grammar.
    """
    if os.environ.get("ZXB_PARSER_DEBUG"):
        return {"debug": True}

    return {"debug": False, "errorlog": _QuietPlyLogger()}


def source_signature(paths: Iterable[str]) -> str:
    """A digest of the given source files, for keying a cached parser table."""
    h = hashlib.sha256()
    for path in sorted(paths):
        try:
            h.update(pathlib.Path(path).read_bytes())
        except OSError:
            h.update(b"<missing>")
        h.update(b"\0")
    return h.hexdigest()


def get_or_create(key: str, fn: Callable[[], Any], depends_on: Iterable[str] = ()) -> Any:
    """Returns the cached object for `key`, building and caching it if needed.

    `depends_on` names the source files the object is derived from. The cache
    entry records their digest and is discarded when it changes.

    Without that, a cached PLY parser is reused whatever the grammar now says --
    PLY's own signature check never runs, because the point of this cache is to
    avoid calling yacc.yacc() at all. Adding or changing a rule then produces
    "Syntax Error. Unexpected token" for perfectly valid source until somebody
    deletes parsetab/tabs.dbm* by hand, which is a hard thing to guess.

    An entry written by an older version is not a dict and simply misses.
    """
    sig = source_signature(depends_on)
    cached = load_object(key)
    if isinstance(cached, dict) and cached.get("sig") == sig:
        return cached["obj"]

    return save_object(key, {"sig": sig, "obj": fn()})["obj"]


def timeout(seconds: Callable[[], int] | int = 10, error_message=os.strerror(errno.ETIME)):
    def decorator(func):
        def _handle_timeout(signum, frame):
            raise TimeoutError(error_message)

        def wrapper(*args, **kwargs):
            signal.signal(signal.SIGALRM, _handle_timeout)
            signal.alarm(seconds() if isinstance(seconds, Callable) else seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result

        return wraps(func)(wrapper)

    return decorator


@contextmanager
def chdir(path: str):
    """Context manager to temporarily enter a directory, and return back
    to the original folder upon exit."""
    current_path = os.path.abspath(os.getcwd())

    try:
        os.chdir(path)
        yield

    finally:
        os.chdir(current_path)
