package com.rbelouin.wadl2json

object Main {
  def main(args: Array[String]): Unit = {
    args.toList match {
      case List(url) => println(url)
      case _ => System.err.println("usage: wadl2json url")
    }
  }
}
