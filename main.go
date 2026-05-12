package main

import (
	"crypto/rand"
	"encoding/base64"
	"flag"
	"fmt"
	"os"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	genid          := flag.NewFlagSet("genid", flag.ExitOnError)
	length         := genid.Int("l", 32, "ID length")

	genhash        := flag.NewFlagSet("genhash", flag.ExitOnError)
	password       := genhash.String("p", "", "Password")
	cost           := genhash.Int("c", 12, "bcrypt cost")

	checkhash      := flag.NewFlagSet("checkhash", flag.ExitOnError)
	hashedPassword := checkhash.String("b", "", "Hashed password")
	plainPassword  := checkhash.String("p", "", "Plain password")

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
		fmt.Print(bcrypt.CompareHashAndPassword([]byte(*hashedPassword), []byte(*plainPassword)) == nil)
	}
}

func usage() {
	os.Stderr.WriteString("usage: kryptgo genid [-l length] [-h]\n" +
                              "       kryptgo genhash -p password [-c cost] [-h]\n" +
                              "       kryptgo checkhash -b hashedPassword -p plainPassword [-h]\n")
	flag.PrintDefaults()
	os.Exit(2)
}
