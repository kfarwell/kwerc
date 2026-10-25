package main

import (
	"crypto/rand"
	"encoding/base64"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	genid          := flag.NewFlagSet("genid", flag.ExitOnError)
	length         := genid.Int("l", 32, "ID length")

	genhash        := flag.NewFlagSet("genhash", flag.ExitOnError)
	password       := genhash.String("p", "", "Password (default: read from stdin)")
	cost           := genhash.Int("c", 12, "bcrypt cost")

	checkhash      := flag.NewFlagSet("checkhash", flag.ExitOnError)
	hashedPassword := checkhash.String("b", "", "Hashed password")
	hashFile       := checkhash.String("f", "", "File containing the hashed password")
	plainPassword  := checkhash.String("p", "", "Plain password (default: read from stdin)")

	if len(os.Args) < 2 {
		usage()
	}

	switch os.Args[1] {
	case "genid":
		genid.Parse(os.Args[2:])
	case "genhash":
		genhash.Parse(os.Args[2:])
	case "checkhash":
		checkhash.Parse(os.Args[2:])
	default:
		usage()
	}

	if genid.Parsed() {
		b := make([]byte, *length)
		_, err := rand.Read(b)
		if err == nil {
			str := base64.RawURLEncoding.EncodeToString(b)
			fmt.Print(str)
		} else {
			os.Exit(1)
		}
	}

	if genhash.Parsed() {
		if !isSet(genhash, "p") {
			*password = readStdin()
		}
		if *password == "" {
			usage()
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(*password), *cost)
		if err == nil {
			fmt.Print(string(hash))
		} else {
			os.Exit(1)
		}
	}

	if checkhash.Parsed() {
		if *hashFile != "" {
			b, err := os.ReadFile(*hashFile)
			if err != nil {
				fmt.Print(false)
				os.Exit(1)
			}
			*hashedPassword = strings.TrimSpace(string(b))
		}
		if !isSet(checkhash, "p") {
			*plainPassword = readStdin()
		}
		ok := bcrypt.CompareHashAndPassword([]byte(*hashedPassword), []byte(*plainPassword)) == nil
		fmt.Print(ok)
		if !ok {
			os.Exit(1)
		}
	}
}

// isSet reports whether flag name was given on the command line
func isSet(fs *flag.FlagSet, name string) bool {
	set := false
	fs.Visit(func(f *flag.Flag) {
		if f.Name == name {
			set = true
		}
	})
	return set
}

// readStdin returns all of stdin, so secrets need not appear in argv
func readStdin() string {
	b, err := io.ReadAll(os.Stdin)
	if err != nil {
		os.Exit(1)
	}
	return string(b)
}

func usage() {
	os.Stderr.WriteString("usage: kryptgo genid [-l length] [-h]\n" +
                              "       kryptgo genhash [-p password] [-c cost] [-h]\n" +
                              "       kryptgo checkhash -b hashedPassword | -f hashFile [-p plainPassword] [-h]\n" +
                              "Passwords are read from stdin when -p is not given.\n" +
                              "checkhash prints true or false and exits 0 or 1.\n")
	flag.PrintDefaults()
	os.Exit(2)
}
