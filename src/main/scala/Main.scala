package com.rbelouin.wadl2json

object Main {
  def main(args: Array[String]): Unit = {
    args.toList match {
      case List(url) => Wadl.fromUrl(url).map(Wadl2Json.fromXML(_)).fold(
        println(_),
        System.err.println(_)
      )
      case _ => System.err.println("usage: wadl2json url")
    }
  }
}
