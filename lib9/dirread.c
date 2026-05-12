#include <u.h>
#define NOPLAN9DEFINES
#include <libc.h>
#include <sys/stat.h>
#include <dirent.h>

#if defined (__linux__)
# include <sys/syscall.h>
# if defined (_LARGEFILE64_SOURCE)
#  define getdents SYS_getdents64
# else
#  define getdents SYS_getdents
# endif
#endif

extern int _p9dir(struct stat*, struct stat*, char*, Dir*, char**, char*);

#if defined(__linux__)
static int
mygetdents(int fd, struct dirent *buf, int n) {
	return syscall (getdents, fd, (void*) buf, n);
}
#elif defined(__APPLE__)
#define NDIRFDS 256
static struct { int fd; DIR *dir; } dirtab[NDIRFDS];

static DIR *
opendirfd(int fd)
{
	int i, dupfd;
	DIR *d;

	for(i = 0; i < NDIRFDS; i++)
		if(dirtab[i].dir != NULL && dirtab[i].fd == fd)
			return dirtab[i].dir;
	for(i = 0; i < NDIRFDS; i++)
		if(dirtab[i].dir == NULL){
			dupfd = dup(fd);
			if(dupfd < 0)
				return NULL;
			d = fdopendir(dupfd);
			if(d == NULL){
				close(dupfd);
				return NULL;
			}
			dirtab[i].fd = fd;
			dirtab[i].dir = d;
			return d;
		}
	return NULL;
}

static void
closedirfd(int fd)
{
	int i;
	for(i = 0; i < NDIRFDS; i++)
		if(dirtab[i].dir != NULL && dirtab[i].fd == fd){
			closedir(dirtab[i].dir);
			dirtab[i].dir = NULL;
			return;
		}
}

static int
mygetdents(int fd, struct dirent *buf, int n)
{
	DIR *dir;
	struct dirent *de;
	char *p = (char*)buf;
	int used = 0;
	long pos;

	dir = opendirfd(fd);
	if(dir == NULL)
		return -1;

	for(;;){
		pos = telldir(dir);
		de = readdir(dir);
		if(de == NULL)
			break;
		if(used + de->d_reclen > n){
			seekdir(dir, pos);
			break;
		}
		memcpy(p + used, de, de->d_reclen);
		used += de->d_reclen;
	}

	if(de == NULL && used == 0)
		closedirfd(fd);
	return used;
}
#elif defined(__FreeBSD__)
static int
mygetdents(int fd, struct dirent *buf, int n)
{
	long off;
	return getdirentries(fd, (void*)buf, n, &off);
}
#elif defined(__OpenBSD__)
#include <sys/param.h>
# if OpenBSD < 201405 /* for OpenBSD 5.4 and earlier */
static int
mygetdents(int fd, struct dirent *buf, int n)
{
	off_t off;
	return getdirentries(fd, (void*)buf, n, &off);
}
# else
static int
mygetdents(int fd, struct dirent *buf, int n)
{
	return getdents(fd, (void*)buf, n);
}
# endif
#elif defined(__sun__) || defined(__NetBSD__)
static int
mygetdents(int fd, struct dirent *buf, int n)
{
	return getdents(fd, (void*)buf, n);
}
#elif defined(__AIX__)
static int
mygetdents(int fd, struct dirent *buf, int n)
{
	return getdirent(fd, (void*)buf, n);
}
#endif

static int
countde(char *p, int n)
{
	char *e;
	int m;
	struct dirent *de;

	e = p+n;
	m = 0;
	while(p < e){
		de = (struct dirent*)p;
		if(de->d_reclen <= 4+2+2+1 || p+de->d_reclen > e)
			break;
		if(de->d_name[0]=='.' && de->d_name[1]==0)
			de->d_name[0] = 0;
		else if(de->d_name[0]=='.' && de->d_name[1]=='.' && de->d_name[2]==0)
			de->d_name[0] = 0;
		m++;
		p += de->d_reclen;
	}
	return m;
}

static int
dirpackage(int fd, char *buf, int n, Dir **dp)
{
	int oldwd;
	char *p, *str, *estr;
	int i, nstr, m;
	struct dirent *de;
	struct stat st, lst;
	Dir *d;

	n = countde(buf, n);
	if(n <= 0)
		return n;

	if((oldwd = open(".", O_RDONLY)) < 0)
		return -1;
	if(fchdir(fd) < 0)
		return -1;
		
	p = buf;
	nstr = 0;

	for(i=0; i<n; i++){
		de = (struct dirent*)p;
		memset(&lst, 0, sizeof lst);
		if(de->d_name[0] == 0)
			/* nothing */ {}
		else if(lstat(de->d_name, &lst) < 0)
			de->d_name[0] = 0;
		else{
			st = lst;
			if(S_ISLNK(lst.st_mode))
				stat(de->d_name, &st);
			nstr += _p9dir(&lst, &st, de->d_name, nil, nil, nil);
		}
		p += de->d_reclen;
	}

	d = malloc(sizeof(Dir)*n+nstr);
	if(d == nil){
		fchdir(oldwd);
		close(oldwd);
		return -1;
	}
	str = (char*)&d[n];
	estr = str+nstr;

	p = buf;
	m = 0;
	for(i=0; i<n; i++){
		de = (struct dirent*)p;
		if(de->d_name[0] != 0 && lstat(de->d_name, &lst) >= 0){
			st = lst;
			if((lst.st_mode&S_IFMT) == S_IFLNK)
				stat(de->d_name, &st);
			_p9dir(&lst, &st, de->d_name, &d[m++], &str, estr);
		}
		p += de->d_reclen;
	}

	fchdir(oldwd);
	close(oldwd);
	*dp = d;
	return m;
}

long
dirread(int fd, Dir **dp)
{
	char *buf;
	struct stat st;
	int n;

	*dp = 0;

	if(fstat(fd, &st) < 0)
		return -1;

	if(st.st_blksize < 8192)
		st.st_blksize = 8192;

	buf = malloc(st.st_blksize);
	if(buf == nil)
		return -1;

	n = mygetdents(fd, (void*)buf, st.st_blksize);
	if(n < 0){
		free(buf);
		return -1;
	}
	n = dirpackage(fd, buf, n, dp);
	free(buf);
	return n;
}


long
dirreadall(int fd, Dir **d)
{
	uchar *buf, *nbuf;
	long n, ts;
	struct stat st;

	if(fstat(fd, &st) < 0)
		return -1;

	if(st.st_blksize < 8192)
		st.st_blksize = 8192;

	buf = nil;
	ts = 0;
	for(;;){
		nbuf = realloc(buf, ts+st.st_blksize);
		if(nbuf == nil){
			free(buf);
			return -1;
		}
		buf = nbuf;
		n = mygetdents(fd, (void*)(buf+ts), st.st_blksize);
		if(n <= 0)
			break;
		ts += n;
	}
	if(ts >= 0)
		ts = dirpackage(fd, (char*)buf, ts, d);
	free(buf);
	if(ts == 0 && n < 0)
		return -1;
	return ts;
}
