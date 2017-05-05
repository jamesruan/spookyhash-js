#include "SpookyV2.h"
#include "cstdio"
#include "cstring"

int main() {
	using namespace std;
	char const * str= "The quick brown fox jumps over the lazy dog";
	char const * strlong = "The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog";
	int len = strlen(str);
	uint64 hash1, hash2;
	hash1 = 0LL;
	hash2 = 0LL;
	SpookyHash::Hash128(str, len, &hash1, &hash2);
	printf("len: %d %llx %llx\n", len, hash1, hash2);

	hash1 = 0LL;
	hash2 = 0LL;
	int lenlong = strlen(strlong);
	SpookyHash::Hash128(strlong, lenlong, &hash1, &hash2);
	printf("len: %d %llx %llx\n", lenlong, hash1, hash2);
}
